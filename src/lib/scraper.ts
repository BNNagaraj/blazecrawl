import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import {
  renderPage,
  takeScreenshot,
  generatePdf,
  isPlaywrightAvailable,
} from "@/lib/browser";
import type { RenderOptions } from "@/lib/browser";
import { getCached, setCache } from "@/lib/cache";
import { getRandomUserAgent } from "@/lib/proxy";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapeOptions {
  format?: "markdown" | "html" | "text" | "json";
  waitFor?: string;
  timeout?: number;
  headers?: Record<string, string>;
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  /** Use Playwright to render JavaScript before scraping. */
  renderJs?: boolean;
  /** Capture a screenshot of the page (base64 PNG). */
  screenshot?: boolean;
  /** Generate a PDF of the page (base64). */
  pdf?: boolean;
  /** Skip the Firestore response cache. */
  skipCache?: boolean;
}

export interface ScrapeResult {
  success: boolean;
  data?: {
    url: string;
    markdown?: string;
    html?: string;
    text?: string;
    screenshot?: string;
    pdf?: string;
    metadata: {
      title: string;
      description: string;
      ogImage: string | null;
      statusCode: number;
      loadTimeMs: number;
    };
  };
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractMetadata(doc: Document, statusCode: number, loadTimeMs: number) {
  const getMeta = (name: string): string => {
    const el =
      doc.querySelector(`meta[property="${name}"]`) ??
      doc.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute("content") ?? "";
  };

  return {
    title: doc.title || getMeta("og:title") || "",
    description: getMeta("description") || getMeta("og:description") || "",
    ogImage: getMeta("og:image") || null,
    statusCode,
    loadTimeMs,
  };
}

/**
 * Filter DOM by includeTags / excludeTags before extraction.
 * - excludeTags: remove matching elements entirely
 * - includeTags: keep only matching elements (wrap in a container)
 */
function applyTagFilters(
  doc: Document,
  includeTags?: string[],
  excludeTags?: string[],
): void {
  if (excludeTags?.length) {
    for (const selector of excludeTags) {
      doc.querySelectorAll(selector).forEach((el) => el.remove());
    }
  }

  if (includeTags?.length) {
    const body = doc.body;
    const kept: Element[] = [];
    for (const selector of includeTags) {
      body.querySelectorAll(selector).forEach((el) => kept.push(el));
    }
    body.innerHTML = "";
    for (const el of kept) {
      body.appendChild(el);
    }
  }
}

// ─── Turndown instance ──────────────────────────────────────────────────────

function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  // Strip script/style
  td.remove(["script", "style", "noscript"]);
  return td;
}

// ─── Core scraper ────────────────────────────────────────────────────────────

/**
 * Scrape a URL and return structured content.
 *
 * Fast path: uses fetch + JSDOM + Readability + TurndownService.
 *
 * NOTE: For JavaScript-heavy pages that require client-side rendering,
 * Playwright integration is needed. In production this should be handled
 * by a separate worker service that runs a headless browser pool.
 * The `waitFor` option is a placeholder for that integration.
 */
export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {},
): Promise<ScrapeResult> {
  const {
    format = "markdown",
    timeout = 30_000,
    headers = {},
    includeTags,
    excludeTags,
    onlyMainContent = true,
    renderJs = false,
    screenshot = false,
    pdf = false,
    skipCache = false,
  } = options;

  // --- Validate URL ---
  if (!url || !isValidUrl(url)) {
    return { success: false, error: "Invalid URL. Must be an http or https URL." };
  }

  // --- Cache check ---
  if (!skipCache && !screenshot && !pdf) {
    const cached = await getCached(url);
    if (cached) return cached;
  }

  const startTime = Date.now();

  // --- Determine rendering path ---
  const useBrowser = renderJs && isPlaywrightAvailable();

  let rawHtml: string;
  let statusCode = 200;
  let finalUrl = url;

  if (useBrowser) {
    // ── Browser rendering path ──
    const renderOpts: RenderOptions = {
      waitFor: options.waitFor,
      timeout,
      headers,
      userAgent: getRandomUserAgent(),
    };

    const html = await renderPage(url, renderOpts);
    if (!html) {
      return {
        success: false,
        error: "Browser rendering failed. The page may be unreachable or Playwright encountered an error.",
      };
    }
    rawHtml = html;
  } else {
    // ── Fast path: fetch + JSDOM ──
    let response: Response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      response = await fetch(url, {
        headers: {
          "User-Agent":
            "BlazeCrawl/1.0 (+https://blazecrawl.dev)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...headers,
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timer);
    } catch (err: unknown) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? `Request timed out after ${timeout}ms`
          : `Failed to fetch URL: ${err instanceof Error ? err.message : String(err)}`;
      return { success: false, error: message };
    }

    if (!response.ok && response.status >= 400) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    rawHtml = await response.text();
    statusCode = response.status;
    finalUrl = response.url;
  }

  const loadTimeMs = Date.now() - startTime;

  // --- Parse with JSDOM ---
  let dom: JSDOM;
  try {
    dom = new JSDOM(rawHtml, { url });
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to parse HTML: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const doc = dom.window.document;
  const metadata = extractMetadata(doc, statusCode, loadTimeMs);

  // Apply tag filters
  applyTagFilters(doc, includeTags, excludeTags);

  // --- Extract main content via Readability (optional) ---
  let contentHtml: string;
  if (onlyMainContent) {
    // Readability mutates the DOM, so clone first
    const clone = new JSDOM(dom.serialize(), { url });
    const reader = new Readability(clone.window.document);
    const article = reader.parse();
    contentHtml = article?.content ?? doc.body.innerHTML;
    // Use article title if available and better
    if (article?.title) {
      metadata.title = article.title;
    }
  } else {
    contentHtml = doc.body.innerHTML;
  }

  // --- Convert to requested format ---
  const result: ScrapeResult = {
    success: true,
    data: {
      url: finalUrl, // final URL after redirects
      metadata,
    },
  };

  switch (format) {
    case "html": {
      result.data!.html = contentHtml;
      break;
    }
    case "text": {
      // Simple text extraction: parse the content HTML and grab textContent
      const textDom = new JSDOM(contentHtml);
      result.data!.text = (textDom.window.document.body.textContent ?? "").trim();
      break;
    }
    case "json": {
      // JSON format: return all formats
      const td = createTurndown();
      result.data!.markdown = td.turndown(contentHtml);
      result.data!.html = contentHtml;
      const textDom = new JSDOM(contentHtml);
      result.data!.text = (textDom.window.document.body.textContent ?? "").trim();
      break;
    }
    case "markdown":
    default: {
      const td = createTurndown();
      result.data!.markdown = td.turndown(contentHtml);
      break;
    }
  }

  // --- Screenshot & PDF (browser-only features) ---
  if (screenshot && isPlaywrightAvailable()) {
    try {
      const buf = await takeScreenshot(url, {
        waitFor: options.waitFor,
        timeout,
        headers,
        fullPage: true,
      });
      if (buf) {
        result.data!.screenshot = buf.toString("base64");
      }
    } catch {
      // Non-fatal: screenshot failed but scrape data is still valid
    }
  }

  if (pdf && isPlaywrightAvailable()) {
    try {
      const buf = await generatePdf(url, {
        waitFor: options.waitFor,
        timeout,
        headers,
      });
      if (buf) {
        result.data!.pdf = buf.toString("base64");
      }
    } catch {
      // Non-fatal: PDF generation failed but scrape data is still valid
    }
  }

  // --- Write to cache ---
  if (!skipCache && !screenshot && !pdf) {
    // Don't await — fire and forget so we don't slow down the response
    setCache(url, result).catch(() => {});
  }

  return result;
}

// ─── Link extraction (used by crawl & map) ───────────────────────────────────

/**
 * Extract all anchor href links from an HTML string, resolved against a base URL.
 * Returns only same-origin http/https links by default.
 */
export function extractLinks(html: string, baseUrl: string): string[] {
  const dom = new JSDOM(html, { url: baseUrl });
  const anchors = dom.window.document.querySelectorAll("a[href]");
  const base = new URL(baseUrl);
  const seen = new Set<string>();

  anchors.forEach((a) => {
    try {
      const href = a.getAttribute("href");
      if (!href) return;
      const resolved = new URL(href, baseUrl);
      // Keep only same-origin http(s) links, strip hash
      if (
        (resolved.protocol === "http:" || resolved.protocol === "https:") &&
        resolved.hostname === base.hostname
      ) {
        resolved.hash = "";
        seen.add(resolved.href);
      }
    } catch {
      // skip malformed URLs
    }
  });

  return Array.from(seen);
}
