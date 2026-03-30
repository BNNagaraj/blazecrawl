import { NextRequest } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
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
    const {
      url,
      format = "markdown",
      onlyMainContent,
      renderJs,
      screenshot,
      pdf,
      skipCache,
    } = body;

    if (!url) {
      return withCors({ success: false, error: "url is required" }, 400);
    }

    const result = await scrapeUrl(url, {
      format,
      onlyMainContent,
      ...(renderJs !== undefined && { renderJs }),
      ...(screenshot !== undefined && { screenshot }),
      ...(pdf !== undefined && { pdf }),
      ...(skipCache !== undefined && { skipCache }),
    });

    if (!result.success) {
      return withCors({ success: false, error: result.error }, 500);
    }

    await trackUsage(auth.apiKey!, 1);

    return withCors(
      { success: true, data: result.data },
      200,
      { "X-RateLimit-Limit": String(auth.rateLimit.limit) },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    return withCors({ success: false, error: message }, 500);
  }
}
