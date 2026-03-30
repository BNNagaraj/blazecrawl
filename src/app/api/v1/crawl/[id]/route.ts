import { NextRequest } from "next/server";
import { withCors, optionsResponse } from "@/lib/cors";
import { crawlJobs } from "../route";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = crawlJobs.get(id);

  if (!job) {
    return withCors({ success: false, error: "Job not found" }, 404);
  }

  return withCors({
    success: true,
    data: {
      status: job.status,
      pagesFound: job.pagesFound,
      pagesCrawled: job.pagesCrawled,
      results: job.results,
    },
  });
}
