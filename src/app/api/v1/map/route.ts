import { NextRequest } from "next/server";
import { extractLinks } from "@/lib/scraper";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

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
    const { url, maxPages = 100 } = body;

    if (!url) {
      return withCors({ success: false, error: "url is required" }, 400);
    }

    const allUrls = new Set<string>();
    const base = new URL(url);

    // Fetch page + sitemap in parallel
    const [pageRes, sitemapRes] = await Promise.allSettled([
      fetch(url, {
        headers: { "User-Agent": "BlazeCrawl/1.0 (+https://blazecrawl.dev)" },
        signal: AbortSignal.timeout(15000),
      }),
      fetch(`${base.origin}/sitemap.xml`, {
        headers: { "User-Agent": "BlazeCrawl/1.0 (+https://blazecrawl.dev)" },
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    if (pageRes.status === "fulfilled") {
      const html = await pageRes.value.text();
      extractLinks(html, url).forEach((u) => allUrls.add(u));
    }

    if (sitemapRes.status === "fulfilled" && sitemapRes.value.ok) {
      const xml = await sitemapRes.value.text();
      const locMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
      for (const m of locMatches) {
        allUrls.add(m[1]);
      }
    }

    const urls = [...allUrls].slice(0, maxPages);

    await trackUsage(auth.apiKey!, 1);

    return withCors({ success: true, data: { url, totalUrls: urls.length, urls } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Map failed";
    return withCors({ success: false, error: message }, 500);
  }
}
