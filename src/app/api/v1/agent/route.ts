import { NextRequest } from "next/server";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { getUsage } from "@/lib/api-keys";
import { withCors, optionsResponse } from "@/lib/cors";
import { checkTierAccess } from "@/lib/tier-check";
import { scrapeUrl } from "@/lib/scraper";
import { doc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { getAppDb } from "@/lib/firebase";

export const dynamic = "force-dynamic";

const CREDITS_PER_STEP = 5;
const DEFAULT_MAX_STEPS = 10;
const MAX_STEPS_LIMIT = 50;
const DEFAULT_MAX_URLS = 5;

const AGENT_SYSTEM_PROMPT = `You are a web research agent that gathers data from the internet according to the user's prompt.

You operate in a loop. At each step you receive the current accumulated results and must decide your next action.

Respond with EXACTLY ONE JSON object (no markdown, no explanation) with one of these formats:

1. Scrape a URL:
   {"action": "scrape", "url": "<url>", "reason": "<why>"}

2. Finish and return results:
   {"action": "finish", "summary": "<final summary>", "data": <structured result object>}

Guidelines:
- Be methodical: start with the most relevant sources.
- Extract only the data the user asked for.
- When you have enough information, use "finish" immediately — do not waste steps.
- If a scrape fails, try an alternative source.
- Never scrape more URLs than necessary.`;

interface AgentStep {
  stepNumber: number;
  action: string;
  url?: string;
  reason?: string;
  result?: string;
  error?: string;
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

    // Feature gate: agent requires growth tier or above
    const tierBlock = checkTierAccess(auth, "agent");
    if (tierBlock) return tierBlock;

    // Check credits upfront (minimum 1 step)
    if (auth.userId && auth.userId !== "dev-user") {
      const usage = await getUsage(auth.userId);
      if (usage.remainingCredits < CREDITS_PER_STEP) {
        return withCors({
          success: false,
          error: `Insufficient credits. Agent costs ${CREDITS_PER_STEP} credits per step. You have ${usage.remainingCredits} remaining. Upgrade your plan at https://blazecrawl.dev/dashboard`,
        }, 429);
      }
    }

    const body = await req.json();
    const { prompt, maxSteps, maxUrls } = body;

    if (!prompt || typeof prompt !== "string") {
      return withCors({ success: false, error: "prompt is required and must be a string" }, 400);
    }

    const resolvedMaxSteps = Math.min(
      Math.max(1, maxSteps ?? DEFAULT_MAX_STEPS),
      MAX_STEPS_LIMIT,
    );
    const resolvedMaxUrls = Math.max(1, maxUrls ?? DEFAULT_MAX_URLS);

    // Create job document
    const jobId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const db = getAppDb();
    const jobRef = doc(db, "agentJobs", jobId);

    await setDoc(jobRef, {
      jobId,
      userId: auth.userId,
      prompt,
      maxSteps: resolvedMaxSteps,
      maxUrls: resolvedMaxUrls,
      status: "running",
      steps: [],
      result: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Run agent loop in the background (non-blocking)
    runAgentLoop({
      jobId,
      prompt,
      maxSteps: resolvedMaxSteps,
      maxUrls: resolvedMaxUrls,
      apiKey: auth.apiKey!,
    }).catch(() => {
      // Errors are captured in the job document
    });

    return withCors({
      success: true,
      data: { jobId, status: "running" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Agent request failed";
    return withCors({ success: false, error: message }, 500);
  }
}

async function runAgentLoop(params: {
  jobId: string;
  prompt: string;
  maxSteps: number;
  maxUrls: number;
  apiKey: string;
}): Promise<void> {
  const { jobId, prompt, maxSteps, maxUrls, apiKey } = params;
  const db = getAppDb();
  const jobRef = doc(db, "agentJobs", jobId);

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    await updateDoc(jobRef, {
      status: "failed",
      error: "Anthropic API key not configured",
      updatedAt: Timestamp.now(),
    });
    return;
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: anthropicApiKey });

  const steps: AgentStep[] = [];
  let urlsScraped = 0;
  let accumulatedData: string[] = [];

  try {
    for (let i = 0; i < maxSteps; i++) {
      const contextMessage = i === 0
        ? `User prompt: ${prompt}\n\nYou have ${maxSteps} steps and can scrape up to ${maxUrls} URLs. Begin.`
        : `User prompt: ${prompt}\n\nSteps completed: ${i}/${maxSteps}\nURLs scraped: ${urlsScraped}/${maxUrls}\n\nAccumulated results:\n${accumulatedData.join("\n\n---\n\n")}\n\nDecide your next action.`;

      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: AGENT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: contextMessage }],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "";

      let decision: { action: string; url?: string; reason?: string; summary?: string; data?: unknown };
      try {
        decision = JSON.parse(text);
      } catch {
        // If Claude doesn't return valid JSON, treat as finish
        decision = { action: "finish", summary: text, data: null };
      }

      const step: AgentStep = {
        stepNumber: i + 1,
        action: decision.action,
        url: decision.url,
        reason: decision.reason,
      };

      if (decision.action === "scrape" && decision.url) {
        if (urlsScraped >= maxUrls) {
          step.error = "Max URLs reached";
          decision.action = "finish";
        } else {
          try {
            const scraped = await scrapeUrl(decision.url);
            if (scraped.success && scraped.data) {
              const content = scraped.data.markdown?.slice(0, 8000) ?? "";
              step.result = `Scraped ${decision.url}: ${content.slice(0, 200)}...`;
              accumulatedData.push(`[${decision.url}]\n${content}`);
              urlsScraped++;
            } else {
              step.error = scraped.error || "Scrape failed";
              accumulatedData.push(`[${decision.url}] ERROR: ${step.error}`);
            }
          } catch (err: unknown) {
            step.error = err instanceof Error ? err.message : "Scrape error";
            accumulatedData.push(`[${decision.url}] ERROR: ${step.error}`);
          }
        }
      }

      steps.push(step);

      // Track credits for this step
      await trackUsage(apiKey, CREDITS_PER_STEP);

      // Update job with current progress
      await updateDoc(jobRef, {
        steps,
        status: decision.action === "finish" ? "completed" : "running",
        updatedAt: Timestamp.now(),
        ...(decision.action === "finish"
          ? { result: { summary: decision.summary, data: decision.data } }
          : {}),
      });

      if (decision.action === "finish") {
        return;
      }
    }

    // Max steps reached — ask Claude for a final summary
    const finalMessage = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `User prompt: ${prompt}\n\nAll ${maxSteps} steps used. Accumulated results:\n${accumulatedData.join("\n\n---\n\n")}\n\nYou MUST finish now. Use the "finish" action with a summary.`,
        },
      ],
    });

    const finalText = finalMessage.content[0].type === "text" ? finalMessage.content[0].text : "";
    let finalResult: { summary?: string; data?: unknown };
    try {
      finalResult = JSON.parse(finalText);
    } catch {
      finalResult = { summary: finalText, data: null };
    }

    await updateDoc(jobRef, {
      steps,
      status: "completed",
      result: { summary: finalResult.summary ?? finalText, data: finalResult.data ?? null },
      updatedAt: Timestamp.now(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Agent loop failed";
    await updateDoc(jobRef, {
      steps,
      status: "failed",
      error: errorMessage,
      updatedAt: Timestamp.now(),
    });
  }
}
