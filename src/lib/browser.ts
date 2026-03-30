// ─── Playwright-based browser rendering engine ─────────────────────────────
//
// Uses playwright-core (lighter weight, no bundled browsers).
// Falls back gracefully when Playwright is not installed.

import { getProxy, getRandomUserAgent } from "@/lib/proxy";

// ─── Dynamic import types ───────────────────────────────────────────────────
// playwright-core is an optional peer dep; types are resolved at runtime.
// We use `any` wrappers to avoid requiring @types/playwright-core at build time.

/* eslint-disable @typescript-eslint/no-explicit-any */
type PlaywrightModule = any;
type Browser = any;
type BrowserContext = any;
type Page = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Options ────────────────────────────────────────────────────────────────

export interface RenderOptions {
  waitFor?: string; // CSS selector or "networkidle"
  timeout?: number;
  headers?: Record<string, string>;
  proxy?: string;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export interface ScreenshotOptions extends RenderOptions {
  fullPage?: boolean;
  type?: "png" | "jpeg";
  quality?: number; // 0-100, jpeg only
}

export interface PdfOptions extends RenderOptions {
  format?: "A4" | "Letter" | "Legal";
  landscape?: boolean;
  printBackground?: boolean;
}

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "wait" | "press" | "screenshot";
  selector?: string;
  value?: string;
  key?: string;
  x?: number;
  y?: number;
  timeout?: number;
}

export interface ActionResult {
  html: string;
  screenshots: Buffer[];
}

export interface BrowserSession {
  id: string;
  context: BrowserContext;
  page: Page;
  lastActivity: number;
}

// ─── Singleton browser pool ─────────────────────────────────────────────────

let _pw: PlaywrightModule | null = null;
let _browser: Browser | null = null;
let _browserPromise: Promise<Browser | null> | null = null;
let _available: boolean | null = null;

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const sessions = new Map<string, BrowserSession>();
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Check whether playwright-core is available at runtime.
 */
export function isPlaywrightAvailable(): boolean {
  if (_available !== null) return _available;
  // Will be resolved when getBrowser() is first called
  // Default to false — getBrowser() sets it to true on success
  _available = false;
  return _available;
}

/**
 * Lazily launch a shared Chromium browser instance.
 */
async function getBrowser(): Promise<Browser | null> {
  if (_browser?.isConnected()) return _browser;

  if (_browserPromise) return _browserPromise;

  _browserPromise = (async () => {
    try {
      if (!_pw) {
        // Dynamic import — playwright-core is optional
        _pw = await (Function('return import("playwright-core")')() as Promise<PlaywrightModule>);
      }
      _browser = await _pw.chromium.launch({
        headless: true,
        args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      });
      startSessionCleanup();
      return _browser;
    } catch {
      _available = false;
      _browser = null;
      return null;
    } finally {
      _browserPromise = null;
    }
  })();

  return _browserPromise;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function createContext(
  browser: Browser,
  options: RenderOptions = {},
): Promise<BrowserContext> {
  const proxy = options.proxy ?? getProxy();
  const userAgent = options.userAgent ?? getRandomUserAgent();
  const viewport = options.viewport ?? { width: 1280, height: 720 };

  const contextOptions: Record<string, unknown> = {
    userAgent,
    viewport,
    ignoreHTTPSErrors: true,
  };

  if (proxy) {
    contextOptions.proxy = { server: proxy };
  }

  const context = await browser.newContext(contextOptions);

  if (options.headers) {
    await context.setExtraHTTPHeaders(options.headers);
  }

  return context;
}

/**
 * Smart wait: try networkidle (5s cap), fallback to domcontentloaded.
 */
async function smartNavigate(
  page: Page,
  url: string,
  options: RenderOptions = {},
): Promise<void> {
  const timeout = options.timeout ?? 30_000;

  if (options.waitFor && options.waitFor !== "networkidle") {
    // User specified a CSS selector — load page then wait for selector
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });
    await page.waitForSelector(options.waitFor, { timeout });
    return;
  }

  // Smart wait: try networkidle with a short timeout, fallback to domcontentloaded
  try {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: Math.min(timeout, 5000),
    });
  } catch {
    // networkidle timed out — page is likely still loading dynamic content
    // but DOM should be ready
    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout,
      });
    } catch {
      // If even domcontentloaded fails, we may have already navigated in the
      // first attempt. Just wait a beat for any pending renders.
      await page.waitForTimeout(1000);
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Render a page using a headless browser and return the full HTML.
 * Returns `null` if Playwright is unavailable or an error occurs.
 */
export async function renderPage(
  url: string,
  options: RenderOptions = {},
): Promise<string | null> {
  const browser = await getBrowser();
  if (!browser) return null;

  let context: BrowserContext | null = null;
  try {
    context = await createContext(browser, options);
    const page = await context.newPage();
    await smartNavigate(page, url, options);
    return await page.content();
  } catch {
    return null;
  } finally {
    await context?.close();
  }
}

/**
 * Take a screenshot of a page.
 * Returns `null` if Playwright is unavailable or an error occurs.
 */
export async function takeScreenshot(
  url: string,
  options: ScreenshotOptions = {},
): Promise<Buffer | null> {
  const browser = await getBrowser();
  if (!browser) return null;

  let context: BrowserContext | null = null;
  try {
    context = await createContext(browser, options);
    const page = await context.newPage();
    await smartNavigate(page, url, options);

    const buffer = await page.screenshot({
      fullPage: options.fullPage ?? false,
      type: options.type ?? "png",
      ...(options.type === "jpeg" && options.quality
        ? { quality: options.quality }
        : {}),
    });

    return Buffer.from(buffer);
  } catch {
    return null;
  } finally {
    await context?.close();
  }
}

/**
 * Generate a PDF of a page.
 * Returns `null` if Playwright is unavailable or an error occurs.
 */
export async function generatePdf(
  url: string,
  options: PdfOptions = {},
): Promise<Buffer | null> {
  const browser = await getBrowser();
  if (!browser) return null;

  let context: BrowserContext | null = null;
  try {
    context = await createContext(browser, options);
    const page = await context.newPage();
    await smartNavigate(page, url, options);

    const buffer = await page.pdf({
      format: options.format ?? "A4",
      landscape: options.landscape ?? false,
      printBackground: options.printBackground ?? true,
    });

    return Buffer.from(buffer);
  } catch {
    return null;
  } finally {
    await context?.close();
  }
}

/**
 * Execute a sequence of browser actions on a page and return the final state.
 * Returns `null` if Playwright is unavailable or an error occurs.
 */
export async function performActions(
  url: string,
  actions: BrowserAction[],
  options: RenderOptions = {},
): Promise<ActionResult | null> {
  const browser = await getBrowser();
  if (!browser) return null;

  let context: BrowserContext | null = null;
  try {
    context = await createContext(browser, options);
    const page = await context.newPage();
    await smartNavigate(page, url, options);

    const screenshots: Buffer[] = [];

    for (const action of actions) {
      const actionTimeout = action.timeout ?? 5000;

      switch (action.type) {
        case "click":
          if (action.selector) {
            await page.click(action.selector, { timeout: actionTimeout });
          } else if (action.x !== undefined && action.y !== undefined) {
            await page.mouse.click(action.x, action.y);
          }
          break;

        case "type":
          if (action.selector && action.value) {
            await page.fill(action.selector, action.value, {
              timeout: actionTimeout,
            });
          }
          break;

        case "scroll":
          if (action.y !== undefined) {
            await page.evaluate((y: number) => window.scrollBy(0, y), action.y);
          } else if (action.selector) {
            await page.evaluate(
              (sel: string) =>
                document.querySelector(sel)?.scrollIntoView({ behavior: "smooth" }),
              action.selector,
            );
          }
          break;

        case "wait":
          if (action.selector) {
            await page.waitForSelector(action.selector, {
              timeout: actionTimeout,
            });
          } else if (action.timeout) {
            await page.waitForTimeout(action.timeout);
          }
          break;

        case "press":
          if (action.key) {
            await page.keyboard.press(action.key);
          }
          break;

        case "screenshot": {
          const buf = await page.screenshot({ fullPage: false });
          screenshots.push(Buffer.from(buf));
          break;
        }
      }
    }

    const html = await page.content();
    return { html, screenshots };
  } catch {
    return null;
  } finally {
    await context?.close();
  }
}

// ─── Session management (Browser Sandbox) ───────────────────────────────────

/**
 * Create a persistent browser session.
 */
export async function createSession(): Promise<BrowserSession | null> {
  const browser = await getBrowser();
  if (!browser) return null;

  try {
    const id = crypto.randomUUID();
    const context = await createContext(browser);
    const page = await context.newPage();

    const session: BrowserSession = {
      id,
      context,
      page,
      lastActivity: Date.now(),
    };

    sessions.set(id, session);
    return session;
  } catch {
    return null;
  }
}

/**
 * Retrieve an existing session by ID, updating its last-activity timestamp.
 */
export function getSession(id: string): BrowserSession | null {
  const session = sessions.get(id);
  if (!session) return null;
  session.lastActivity = Date.now();
  return session;
}

/**
 * Destroy a session, closing its browser context.
 */
export async function destroySession(id: string): Promise<void> {
  const session = sessions.get(id);
  if (!session) return;

  sessions.delete(id);
  try {
    await session.context.close();
  } catch {
    // Context may already be closed.
  }
}

// ─── Session cleanup ────────────────────────────────────────────────────────

function startSessionCleanup(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(async () => {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, session] of sessions) {
      if (now - session.lastActivity > SESSION_TTL_MS) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      await destroySession(id);
    }
  }, 60_000); // Check every minute

  // Allow the process to exit even if the interval is running
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}
