import { NextRequest } from "next/server";
import { authenticateRequest, trackUsage } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";

export const dynamic = "force-dynamic";

interface Action {
  type: "click" | "type" | "scroll" | "wait" | "press" | "screenshot";
  selector?: string;
  value?: string;
  key?: string;
  direction?: "up" | "down";
  milliseconds?: number;
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
    const { url, actions, format = "markdown" } = body;

    if (!url) {
      return withCors({ success: false, error: "url is required" }, 400);
    }

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return withCors(
        { success: false, error: "actions array is required and must not be empty" },
        400,
      );
    }

    // Dynamically import the browser module
    let browser;
    try {
      browser = await import("@/lib/browser");
      if (!browser.isPlaywrightAvailable()) {
        throw new Error("not available");
      }
    } catch {
      return withCors(
        {
          success: false,
          error: "Browser module is not available. Playwright may not be installed in this environment.",
        },
        501,
      );
    }

    // Use performActions from the browser module
    const result = await browser.performActions(
      url,
      actions.map((a: Action) => ({
        type: a.type,
        selector: a.selector,
        value: a.value,
        key: a.key,
        direction: a.direction,
        milliseconds: a.milliseconds,
      })),
    );

    if (!result) {
      return withCors({ success: false, error: "Failed to perform actions" }, 500);
    }

    // 2 credits per interact request
    await trackUsage(auth.apiKey!, 2);

    return withCors({
      success: true,
      data: {
        url,
        content: result.html,
        format,
        screenshots: result.screenshots.map((buf: Buffer) => buf.toString("base64")),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Interact failed";
    return withCors({ success: false, error: message }, 500);
  }
}
