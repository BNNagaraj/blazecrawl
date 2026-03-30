import { NextRequest } from "next/server";
import { scrapeUrl, extractLinks } from "@/lib/scraper";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// In-memory crawl job store (replaced by persistent store in production)
const crawlJobs = new Map<
  string,
  { status: string; pagesFound: number; pagesCrawled: number; results: unknown[] }
>();

export { crawlJobs };

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
    const { url, maxPages = 50, maxDepth = 3 } = body;

    if (!url) {
      return withCors({ success: false, error: "url is required" }, 400);
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
          if (result.success && result.data) {
            job.pagesCrawled++;
            job.results.push({
              url: item.url,
              markdown: result.data.markdown,
              metadata: result.data.metadata,
            });

            // Get raw HTML for link extraction
            const htmlResult = await scrapeUrl(item.url, { format: "html" });
            if (htmlResult.success && htmlResult.data?.html) {
              const links = extractLinks(htmlResult.data.html, item.url);
              job.pagesFound = visited.size + links.filter((l) => !visited.has(l)).length;
              for (const link of links) {
                if (!visited.has(link) && visited.size + queue.length < maxPages) {
                  queue.push({ url: link, depth: item.depth + 1 });
                }
              }
            }
          }
        } catch {
          // Skip failed pages
        }
      }

      job.status = "completed";
      await trackUsage(auth.apiKey!, job.pagesCrawled);
    })();

    return withCors({ success: true, data: { jobId, status: "crawling", url } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Crawl failed";
    return withCors({ success: false, error: message }, 500);
  }
}
