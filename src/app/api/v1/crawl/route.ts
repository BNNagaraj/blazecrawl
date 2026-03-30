import { NextRequest } from "next/server";
import { scrapeUrl, extractLinks } from "@/lib/scraper";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { getAppDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const CRAWL_JOBS_COLLECTION = "crawlJobs";

interface CrawlJob {
  status: string;
  pagesFound: number;
  pagesCrawled: number;
  results: unknown[];
  userId: string;
  url: string;
  createdAt: string;
}

function crawlJobRef(jobId: string) {
  return doc(getAppDb(), CRAWL_JOBS_COLLECTION, jobId);
}

async function setCrawlJob(jobId: string, data: CrawlJob): Promise<void> {
  await setDoc(crawlJobRef(jobId), data);
}

async function updateCrawlJob(jobId: string, data: Partial<CrawlJob>): Promise<void> {
  await updateDoc(crawlJobRef(jobId), data);
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
    const { url, maxPages = 50, maxDepth = 3 } = body;

    if (!url) {
      return withCors({ success: false, error: "url is required" }, 400);
    }

    const jobId = uuidv4();
    const job: CrawlJob = {
      status: "crawling",
      pagesFound: 0,
      pagesCrawled: 0,
      results: [],
      userId: auth.userId!,
      url,
      createdAt: new Date().toISOString(),
    };
    await setCrawlJob(jobId, job);

    // Start crawl in background
    (async () => {
      const visited = new Set<string>();
      const queue = [{ url, depth: 0 }];
      const results: unknown[] = [];
      let pagesCrawled = 0;

      while (queue.length > 0 && visited.size < maxPages) {
        const item = queue.shift()!;
        if (visited.has(item.url) || item.depth > maxDepth) continue;
        visited.add(item.url);

        try {
          const result = await scrapeUrl(item.url, { format: "json" });
          if (result.success && result.data) {
            pagesCrawled++;
            results.push({
              url: item.url,
              markdown: result.data.markdown,
              metadata: result.data.metadata,
            });

            if (result.data.html) {
              const links = extractLinks(result.data.html, item.url);
              const pagesFound = visited.size + links.filter((l) => !visited.has(l)).length;
              for (const link of links) {
                if (!visited.has(link) && visited.size + queue.length < maxPages) {
                  queue.push({ url: link, depth: item.depth + 1 });
                }
              }
              // Persist progress periodically (every 5 pages)
              if (pagesCrawled % 5 === 0) {
                await updateCrawlJob(jobId, { pagesCrawled, pagesFound, results });
              }
            }
          }
        } catch {
          // Skip failed pages
        }
      }

      await updateCrawlJob(jobId, {
        status: "completed",
        pagesCrawled,
        pagesFound: visited.size,
        results,
      });
      await trackUsage(auth.apiKey!, pagesCrawled);
    })();

    return withCors({ success: true, data: { jobId, status: "crawling", url } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Crawl failed";
    return withCors({ success: false, error: message }, 500);
  }
}
