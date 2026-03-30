import { NextRequest } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { getAppDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const BATCH_JOBS_COLLECTION = "batchJobs";

interface BatchJob {
  status: string;
  totalUrls: number;
  completedUrls: number;
  failedUrls: number;
  results: unknown[];
  userId: string;
  urls: string[];
  format: string;
  webhook: string | null;
  renderJs: boolean;
  createdAt: string;
}

function batchJobRef(jobId: string) {
  return doc(getAppDb(), BATCH_JOBS_COLLECTION, jobId);
}

async function setBatchJob(jobId: string, data: BatchJob): Promise<void> {
  await setDoc(batchJobRef(jobId), data);
}

async function updateBatchJob(
  jobId: string,
  data: Partial<BatchJob>,
): Promise<void> {
  await updateDoc(batchJobRef(jobId), data);
}

/**
 * Process URLs with limited concurrency.
 */
async function processWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(workers);
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
      urls,
      format = "markdown",
      webhook,
      renderJs = false,
    } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return withCors(
        { success: false, error: "urls array is required and must not be empty" },
        400,
      );
    }

    if (urls.length > 100) {
      return withCors(
        { success: false, error: "Maximum 100 URLs per batch request" },
        400,
      );
    }

    const batchId = uuidv4();
    const job: BatchJob = {
      status: "processing",
      totalUrls: urls.length,
      completedUrls: 0,
      failedUrls: 0,
      results: [],
      userId: auth.userId!,
      urls,
      format,
      webhook: webhook ?? null,
      renderJs,
      createdAt: new Date().toISOString(),
    };
    await setBatchJob(batchId, job);

    // Process in background with max 5 concurrent scrapes
    (async () => {
      const results: unknown[] = [];
      let completedUrls = 0;
      let failedUrls = 0;

      await processWithConcurrency(urls as string[], 5, async (url: string) => {
        try {
          const result = await scrapeUrl(url, { format });
          if (result.success && result.data) {
            results.push({
              url,
              markdown: result.data.markdown,
              html: result.data.html,
              text: result.data.text,
              metadata: result.data.metadata,
            });
            completedUrls++;
          } else {
            results.push({
              url,
              error: result.error ?? "Scrape failed",
            });
            failedUrls++;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Scrape failed";
          results.push({ url, error: msg });
          failedUrls++;
        }

        // Update progress every 5 URLs
        if ((completedUrls + failedUrls) % 5 === 0) {
          await updateBatchJob(batchId, { completedUrls, failedUrls, results });
        }
      });

      await updateBatchJob(batchId, {
        status: "completed",
        completedUrls,
        failedUrls,
        results,
      });

      // Track usage: 1 credit per successfully scraped URL
      await trackUsage(auth.apiKey!, completedUrls);

      // Send webhook if configured
      if (webhook) {
        try {
          await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batchId,
              status: "completed",
              totalUrls: urls.length,
              completedUrls,
              failedUrls,
              results,
            }),
          });
        } catch {
          // Webhook delivery is best-effort
        }
      }
    })();

    return withCors(
      {
        success: true,
        data: {
          batchId,
          status: "processing",
          totalUrls: urls.length,
        },
      },
      200,
      { "X-RateLimit-Limit": String(auth.rateLimit.limit) },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Batch scrape failed";
    return withCors({ success: false, error: message }, 500);
  }
}
