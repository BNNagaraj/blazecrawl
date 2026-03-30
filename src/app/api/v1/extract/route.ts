import { NextRequest } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { getUsage, TIERS } from "@/lib/api-keys";
import { withCors, optionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

const EXTRACT_COST = 5; // credits per extract call

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req.headers.get("authorization"));
    if (!auth.valid) {
      return withCors({ success: false, error: auth.error }, 401);
    }

    // Check credits BEFORE calling Claude API (cost protection)
    if (auth.userId && auth.userId !== "dev-user") {
      const usage = await getUsage(auth.userId);
      if (usage.remainingCredits < EXTRACT_COST) {
        return withCors({
          success: false,
          error: `Insufficient credits. Extract costs ${EXTRACT_COST} credits. You have ${usage.remainingCredits} remaining. Upgrade your plan at https://blazecrawl.dev/dashboard`,
        }, 429);
      }
    }

    const body = await req.json();
    const { url, schema, prompt } = body;

    if (!url || !schema) {
      return withCors({ success: false, error: "url and schema are required" }, 400);
    }

    const scraped = await scrapeUrl(url);
    if (!scraped.success || !scraped.data) {
      return withCors({ success: false, error: scraped.error || "Scrape failed" }, 500);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return withCors({ success: false, error: "Anthropic API key not configured" }, 500);
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
${scraped.data.markdown?.slice(0, 12000) ?? ""}

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

    await trackUsage(auth.apiKey!, EXTRACT_COST);

    return withCors({
      success: true,
      data: { url, extracted, metadata: scraped.data.metadata },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extract failed";
    return withCors({ success: false, error: message }, 500);
  }
}
