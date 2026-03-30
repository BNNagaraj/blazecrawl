"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  FileText,
  Code,
  Type,
  Braces,
  ToggleLeft,
  ToggleRight,
  Search,
  MapPin,
  Monitor,
  Camera,
  FileDown,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Format = "markdown" | "html" | "text" | "json" | "pdf";
type ApiMode = "scrape" | "search" | "map";

interface ScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    text?: string;
    json?: unknown;
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      statusCode?: number;
      sourceURL?: string;
      [key: string]: unknown;
    };
  };
  // search/map responses
  results?: Array<{ url: string; title?: string; description?: string; markdown?: string }>;
  links?: string[];
  error?: string;
}

const formatOptions: { value: Format; label: string; icon: React.ElementType }[] = [
  { value: "markdown", label: "Markdown", icon: FileText },
  { value: "html", label: "HTML", icon: Code },
  { value: "text", label: "Text", icon: Type },
  { value: "json", label: "JSON", icon: Braces },
  { value: "pdf", label: "PDF", icon: FileDown },
];

const apiModes: { value: ApiMode; label: string; icon: React.ElementType }[] = [
  { value: "scrape", label: "Scrape", icon: Monitor },
  { value: "search", label: "Search", icon: Search },
  { value: "map", label: "Map", icon: MapPin },
];

export default function Playground() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<Format>("markdown");
  const [onlyMainContent, setOnlyMainContent] = useState(true);
  const [renderJs, setRenderJs] = useState(false);
  const [screenshot, setScreenshot] = useState(false);
  const [apiMode, setApiMode] = useState<ApiMode>("scrape");
  const [timeout, setTimeoutVal] = useState(30000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Load user's first active API key
  useEffect(() => {
    if (!user || !db) return;
    async function loadKey() {
      const keysRef = collection(db, "apiKeys");
      const q = query(keysRef, where("userId", "==", user!.uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        if (d.data().active) {
          setApiKey(d.id);
          return;
        }
      }
    }
    loadKey();
  }, [user]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    if (!apiKey) {
      setResult({ success: false, error: "No API key found. Create one in the API Keys tab first." });
      return;
    }
    setLoading(true);
    setResult(null);
    setResponseTime(null);

    const start = performance.now();
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      let endpoint = "/api/v1/scrape";
      let body: Record<string, unknown> = {};

      if (apiMode === "scrape") {
        endpoint = "/api/v1/scrape";
        body = {
          url: url.trim(),
          format: format === "pdf" ? "markdown" : format,
          onlyMainContent,
          timeout,
          ...(renderJs && { renderJs: true }),
          ...(screenshot && { screenshot: true }),
          ...(format === "pdf" && { pdf: true }),
        };
      } else if (apiMode === "search") {
        endpoint = "/api/v1/search";
        body = {
          query: url.trim(),
          timeout,
        };
      } else if (apiMode === "map") {
        endpoint = "/api/v1/map";
        body = {
          url: url.trim(),
          timeout,
        };
      }

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data: ScrapeResponse = await res.json();
      setResponseTime(Math.round(performance.now() - start));
      setResult(data);
    } catch (err) {
      setResponseTime(Math.round(performance.now() - start));
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setLoading(false);
    }
  };

  function getOutput(): string {
    if (apiMode === "search" && result?.results) {
      return result.results
        .map((r, i) => `${i + 1}. ${r.title ?? r.url}\n   ${r.url}\n   ${r.description ?? ""}`)
        .join("\n\n");
    }
    if (apiMode === "map" && result?.links) {
      return result.links.join("\n");
    }
    if (!result?.data) return "";
    switch (format) {
      case "markdown": return result.data.markdown ?? "";
      case "html":     return result.data.html ?? "";
      case "text":     return result.data.text ?? result.data.markdown ?? "";
      case "json":     return JSON.stringify(result.data.json ?? result.data, null, 2);
      case "pdf":      return result.data.markdown ?? "(PDF requested — check download)";
      default:         return "";
    }
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(getOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Playground</h2>
        <p className="mt-1 text-sm text-muted">
          Test the BlazeCrawl APIs interactively. Results are live.
        </p>
      </div>

      {/* Input Section */}
      <div className="rounded-xl border border-border bg-surface/60 p-5">
        {/* API Mode Selector */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-muted">API</label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {apiModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setApiMode(mode.value);
                  setResult(null);
                  setUrl("");
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors ${
                  apiMode === mode.value
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                <mode.icon className="h-3.5 w-3.5" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* URL / Query Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            {apiMode === "search" ? "Search Query" : "URL"}
          </label>
          <div className="flex gap-2">
            <input
              type={apiMode === "search" ? "text" : "url"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
              placeholder={
                apiMode === "search"
                  ? "e.g. latest AI news"
                  : apiMode === "map"
                    ? "https://example.com"
                    : "https://example.com"
              }
              className="flex-1 rounded-lg border border-border bg-[#0d1117] px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none focus:border-accent/50"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !url.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {apiMode === "search" ? "Searching..." : apiMode === "map" ? "Mapping..." : "Scraping..."}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {apiMode === "search" ? "Search" : apiMode === "map" ? "Map" : "Scrape"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Format (scrape only) */}
          {apiMode === "scrape" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted">
                Format
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {formatOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                      format === opt.value
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Only Main Content (scrape only) */}
          {apiMode === "scrape" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted">
                Only Main Content
              </label>
              <button
                onClick={() => setOnlyMainContent(!onlyMainContent)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-surface"
              >
                {onlyMainContent ? (
                  <ToggleRight className="h-4 w-4 text-accent" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted" />
                )}
                {onlyMainContent ? "On" : "Off"}
              </button>
            </div>
          )}

          {/* Render JS (scrape only) */}
          {apiMode === "scrape" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted">
                Render JS
              </label>
              <button
                onClick={() => setRenderJs(!renderJs)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-surface"
              >
                {renderJs ? (
                  <ToggleRight className="h-4 w-4 text-accent" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted" />
                )}
                {renderJs ? "On" : "Off"}
              </button>
            </div>
          )}

          {/* Screenshot (scrape only) */}
          {apiMode === "scrape" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-muted">
                Screenshot
              </label>
              <button
                onClick={() => setScreenshot(!screenshot)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-surface"
              >
                {screenshot ? (
                  <ToggleRight className="h-4 w-4 text-accent" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted" />
                )}
                {screenshot ? "On" : "Off"}
              </button>
            </div>
          )}

          {/* Timeout */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={timeout}
              onChange={(e) => setTimeoutVal(Number(e.target.value))}
              min={1000}
              max={60000}
              step={1000}
              className="w-28 rounded-lg border border-border bg-[#0d1117] px-3 py-2 text-xs text-foreground outline-none focus:border-accent/50"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(result || loading) && (
        <div className="mt-6 rounded-xl border border-border bg-surface/60 overflow-hidden">
          {/* Results Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold">Response</span>
              {result && (
                <>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      result.success ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {result.success ? "Success" : "Failed"}
                  </span>
                  {result.data?.metadata?.statusCode && (
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-mono text-muted">
                      {result.data.metadata.statusCode}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {responseTime !== null && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {responseTime}ms
                </span>
              )}
              {result?.success && (
                <button
                  onClick={copyOutput}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy
                </button>
              )}
            </div>
          </div>

          {/* Metadata */}
          {result?.data?.metadata && (
            <div className="border-b border-border/50 px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              {result.data.metadata.title && (
                <span>
                  <span className="text-foreground/60">Title:</span>{" "}
                  {result.data.metadata.title}
                </span>
              )}
              {result.data.metadata.sourceURL && (
                <span>
                  <span className="text-foreground/60">URL:</span>{" "}
                  {result.data.metadata.sourceURL}
                </span>
              )}
              {result.data.metadata.language && (
                <span>
                  <span className="text-foreground/60">Language:</span>{" "}
                  {result.data.metadata.language}
                </span>
              )}
            </div>
          )}

          {/* Screenshot */}
          {result?.success && result?.data?.screenshot && (
            <div className="border-b border-border/50 p-5">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-muted">
                <Camera className="h-3.5 w-3.5 text-accent" />
                Screenshot
              </div>
              <div className="rounded-lg border border-border overflow-hidden bg-white">
                <img
                  src={
                    result.data.screenshot.startsWith("data:")
                      ? result.data.screenshot
                      : `data:image/png;base64,${result.data.screenshot}`
                  }
                  alt="Page screenshot"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Output */}
          <div className="max-h-[500px] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : result?.success ? (
              <pre className="whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed text-foreground/90">
                {getOutput() || "(empty response)"}
              </pre>
            ) : (
              <div className="flex items-center gap-3 p-5 text-sm text-red-400">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <span>{result?.error ?? "Unknown error"}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
