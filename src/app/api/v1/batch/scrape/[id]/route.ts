import { NextRequest } from "next/server";
import { withCors, optionsResponse } from "@/lib/cors";
import { doc, getDoc } from "firebase/firestore";
import { getAppDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const snap = await getDoc(doc(getAppDb(), "batchJobs", id));

  if (!snap.exists()) {
    return withCors({ success: false, error: "Batch job not found" }, 404);
  }

  const job = snap.data();
  return withCors({
    success: true,
    data: {
      batchId: id,
      status: job.status,
      totalUrls: job.totalUrls,
      completedUrls: job.completedUrls,
      failedUrls: job.failedUrls,
      results: job.results,
    },
  });
}
