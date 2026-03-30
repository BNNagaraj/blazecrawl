import { NextRequest } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

interface SearchResult {
  url: string;
  title: string;
  description: string;
}

/**
 * Search via Google Custom Search API.
 * Falls back to DuckDuckGo HTML scraping if Google keys aren't configured.
 */
async function googleSearch(
  query: string,
  limit: number,
  country?: string,
  lang?: string,
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    return duckDuckGoSearch(query, limit);
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: query,
    num: String(limit),
  });
  if (country) params.set("gl", country);
  if (lang) params.set("hl", lang);

  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
  );

  if (!res.ok) {
    // Fall back to DuckDuckGo on API error
    return duckDuckGoSearch(query, limit);
  }

  const json = await res.json();
  const items: unknown[] = json.items ?? [];

  return items.slice(0, limit).map((item: unknown) => {
    const i = item as Record<string, string>;
    return {
      url: i.link ?? "",
      title: i.title ?? "",
      description: i.snippet ?? "",
    };
  });
}

/**
 * Fallback search using DuckDuckGo HTML page.
 */
async function duckDuckGoSearch(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    return [];
  }

  const html = await res.text();
  const results: SearchResult[] = [];

  // Parse DuckDuckGo HTML results
  const resultRegex =
    /<a[^>]+class="result__a"[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
    const rawUrl = match[1];
    const title = match[2].replace(/<[^>]*>/g, "").trim();
    const description = match[3].replace(/<[^>]*>/g, "").trim();

    // DuckDuckGo wraps URLs in a redirect; extract the actual URL
    let finalUrl = rawUrl;
    try {
      const decoded = decodeURIComponent(rawUrl);
      const uddgMatch = decoded.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        finalUrl = decodeURIComponent(uddgMatch[1]);
      }
    } catch {
      // Use raw URL if decoding fails
    }

    if (finalUrl && title) {
      results.push({ url: finalUrl, title, description });
    }
  }

  return results;
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req.headers.get("authorization"));
    if (!auth.valid) {
      return withCors({ success: false, error: auth.error }, 401);
    }

    const body = await req.json();
    const {
      query,
      limit: rawLimit = 5,
      format = "markdown",
      country,
      lang,
    } = body;

    if (!query || typeof query !== "string") {
      return withCors({ success: false, error: "query is required" }, 400);
    }

    const limit = Math.min(Math.max(1, Number(rawLimit) || 5), 20);

    const searchResults = await googleSearch(query, limit, country, lang);

    if (searchResults.length === 0) {
      return withCors({
        success: true,
        data: { query, results: [] },
      });
    }

    // Scrape each result page for full content
    const enriched = await Promise.all(
      searchResults.map(async (sr) => {
        try {
          const scraped = await scrapeUrl(sr.url, { format });
          return {
            url: sr.url,
            title: sr.title,
            description: sr.description,
            markdown: scraped.data?.markdown ?? null,
            metadata: scraped.data?.metadata ?? null,
          };
        } catch {
          return {
            url: sr.url,
            title: sr.title,
            description: sr.description,
            markdown: null,
            metadata: null,
          };
        }
      }),
    );

    // 1 credit per result returned
    await trackUsage(auth.apiKey!, enriched.length);

    return withCors(
      { success: true, data: { query, results: enriched } },
      200,
      { "X-RateLimit-Limit": String(auth.rateLimit.limit) },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return withCors({ success: false, error: message }, 500);
  }
}
