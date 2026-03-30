import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TIERS: Record<string, { monthlyCredits: number; maxConcurrent: number }> = {
  free: { monthlyCredits: 1000, maxConcurrent: 10 },
  pro: { monthlyCredits: 50000, maxConcurrent: 100 },
  scale: { monthlyCredits: Infinity, maxConcurrent: 500 },
};

async function authenticate(req: express.Request, res: express.Response): Promise<{ userId: string; tier: string; apiKey: string } | null> {
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!apiKey) {
    res.status(401).json({ success: false, error: "Missing Authorization header. Use: Bearer <api-key>" });
    return null;
  }

  const snap = await db.collection("apiKeys").doc(apiKey).get();
  if (!snap.exists || !snap.data()?.active) {
    res.status(401).json({ success: false, error: "Invalid or deactivated API key" });
    return null;
  }

  const data = snap.data()!;
  return { userId: data.userId, tier: data.tier || "free", apiKey };
}

async function scrapeUrl(url: string, options: { format?: string; onlyMainContent?: boolean } = {}) {
  const start = Date.now();
  const response = await fetch(url, {
    headers: { "User-Agent": "BlazeCrawl/1.0 (+https://blazecrawl.dev)" },
    signal: AbortSignal.timeout(30000),
  });

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Metadata
  const title = doc.querySelector("title")?.textContent || "";
  const description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || null;

  // Main content extraction
  let contentHtml = html;
  if (options.onlyMainContent !== false) {
    const reader = new Readability(doc);
    const article = reader.parse();
    if (article) contentHtml = article.content;
  }

  // Convert to markdown
  const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
  const markdown = turndown.turndown(contentHtml);
  const text = dom.window.document.body?.textContent || "";

  return {
    url,
    markdown,
    html: contentHtml,
    text: text.replace(/\s+/g, " ").trim(),
    metadata: {
      title,
      description,
      ogImage,
      statusCode: response.status,
      loadTimeMs: Date.now() - start,
    },
  };
}

function extractLinks(html: string, baseUrl: string): string[] {
  const dom = new JSDOM(html, { url: baseUrl });
  const anchors = dom.window.document.querySelectorAll("a[href]");
  const base = new URL(baseUrl);
  const links: string[] = [];

  anchors.forEach((a) => {
    try {
      const href = new URL(a.getAttribute("href")!, baseUrl);
      if (href.hostname === base.hostname && href.protocol.startsWith("http")) {
        links.push(href.origin + href.pathname);
      }
    } catch {}
  });

  return [...new Set(links)];
}

// ---------------------------------------------------------------------------
// POST /api/v1/scrape
// ---------------------------------------------------------------------------
app.post("/api/v1/scrape", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { url, format = "markdown", onlyMainContent } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: "url is required" });
      return;
    }

    const result = await scrapeUrl(url, { format, onlyMainContent });
    const tier = TIERS[auth.tier] || TIERS.free;

    const responseData: Record<string, unknown> = {
      url: result.url,
      metadata: result.metadata,
    };

    if (format === "markdown" || format === "json") responseData.markdown = result.markdown;
    if (format === "html" || format === "json") responseData.html = result.html;
    if (format === "text" || format === "json") responseData.text = result.text;

    res.set("X-RateLimit-Limit", String(tier.monthlyCredits));
    res.json({ success: true, data: responseData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    res.status(500).json({ success: false, error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/crawl
// ---------------------------------------------------------------------------
const crawlJobs = new Map<string, { status: string; pagesFound: number; pagesCrawled: number; results: unknown[] }>();

app.post("/api/v1/crawl", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { url, maxPages = 50, maxDepth = 3 } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: "url is required" });
      return;
    }

    const jobId = uuidv4();
    crawlJobs.set(jobId, { status: "crawling", pagesFound: 0, pagesCrawled: 0, results: [] });

    // Start crawl in background
    (async () => {
      const job = crawlJobs.get(jobId)!;
      const visited = new Set<string>();
      const queue = [{ url, depth: 0 }];

      while (queue.length > 0 && visited.size < maxPages) {
        const item = queue.shift()!;
        if (visited.has(item.url) || item.depth > maxDepth) continue;
        visited.add(item.url);

        try {
          const result = await scrapeUrl(item.url);
          job.pagesCrawled++;
          job.results.push({ url: item.url, markdown: result.markdown, metadata: result.metadata });

          const links = extractLinks(result.html, item.url);
          job.pagesFound = visited.size + links.filter((l) => !visited.has(l)).length;
          for (const link of links) {
            if (!visited.has(link) && visited.size + queue.length < maxPages) {
              queue.push({ url: link, depth: item.depth + 1 });
            }
          }
        } catch {
          // Skip failed pages
        }
      }

      job.status = "completed";
    })();

    res.json({ success: true, data: { jobId, status: "crawling", url } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Crawl failed";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/v1/crawl/:id
app.get("/api/v1/crawl/:id", async (req, res) => {
  const job = crawlJobs.get(req.params.id);
  if (!job) {
    res.status(404).json({ success: false, error: "Job not found" });
    return;
  }
  res.json({
    success: true,
    data: {
      status: job.status,
      pagesFound: job.pagesFound,
      pagesCrawled: job.pagesCrawled,
      results: job.results,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/map
// ---------------------------------------------------------------------------
app.post("/api/v1/map", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { url, maxPages = 100 } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: "url is required" });
      return;
    }

    const allUrls = new Set<string>();
    const base = new URL(url);

    // Fetch page + sitemap in parallel
    const [pageRes, sitemapRes] = await Promise.allSettled([
      fetch(url, { headers: { "User-Agent": "BlazeCrawl/1.0" }, signal: AbortSignal.timeout(15000) }),
      fetch(`${base.origin}/sitemap.xml`, { headers: { "User-Agent": "BlazeCrawl/1.0" }, signal: AbortSignal.timeout(10000) }),
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
    res.json({ success: true, data: { url, totalUrls: urls.length, urls } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Map failed";
    res.status(500).json({ success: false, error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/extract
// ---------------------------------------------------------------------------
app.post("/api/v1/extract", async (req, res) => {
  try {
    const auth = await authenticate(req, res);
    if (!auth) return;

    const { url, schema, prompt } = req.body;
    if (!url || !schema) {
      res.status(400).json({ success: false, error: "url and schema are required" });
      return;
    }

    const scraped = await scrapeUrl(url);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, error: "Anthropic API key not configured" });
      return;
    }

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Extract structured data from this web page content according to the JSON schema below.
${prompt ? `\nAdditional instructions: ${prompt}` : ""}

JSON Schema:
${JSON.stringify(schema, null, 2)}

Web page content:
${scraped.markdown.slice(0, 12000)}

Return ONLY valid JSON matching the schema. No markdown, no explanation.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    let extracted;
    try {
      extracted = JSON.parse(text);
    } catch {
      extracted = { raw: text };
    }

    res.json({
      success: true,
      data: { url, extracted, metadata: scraped.metadata },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extract failed";
    res.status(500).json({ success: false, error: message });
  }
});

// ---------------------------------------------------------------------------
// Export Cloud Function
// ---------------------------------------------------------------------------
export const api = functions.https.onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 120,
    minInstances: 0,
  },
  app,
);
