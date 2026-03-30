import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";
import { doc, getDoc } from "firebase/firestore";
import { getAppDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest(req.headers.get("authorization"));
    if (!auth.valid) {
      return withCors({ success: false, error: auth.error }, 401);
    }

    const { id: jobId } = await params;

    if (!jobId) {
      return withCors({ success: false, error: "Job ID is required" }, 400);
    }

    const db = getAppDb();
    const jobRef = doc(db, "agentJobs", jobId);
    const snap = await getDoc(jobRef);

    if (!snap.exists()) {
      return withCors({ success: false, error: "Agent job not found" }, 404);
    }

    const data = snap.data();

    // Ensure the requesting user owns this job
    if (auth.userId !== "dev-user" && data.userId !== auth.userId) {
      return withCors({ success: false, error: "Agent job not found" }, 404);
    }

    return withCors({
      success: true,
      data: {
        jobId: data.jobId,
        status: data.status,
        stepsCompleted: data.steps?.length ?? 0,
        steps: data.steps,
        result: data.result ?? null,
        error: data.error ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get agent job status";
    return withCors({ success: false, error: message }, 500);
  }
}
