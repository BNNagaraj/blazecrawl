"use client";

import { useState } from "react";
import {
  Flame,
  BookOpen,
  Key,
  Globe,
  Bot,
  Map,
  Cpu,
  Code,
  Gauge,
  AlertTriangle,
  ChevronRight,
  Copy,
  Check,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES & DATA                                                       */
/* ------------------------------------------------------------------ */
interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "scrape", label: "Scrape", icon: Globe },
  { id: "crawl", label: "Crawl", icon: Bot },
  { id: "map", label: "Map", icon: Map },
  { id: "extract", label: "Extract", icon: Cpu },
  { id: "sdks", label: "SDKs", icon: Code },
  { id: "rate-limits", label: "Rate Limits", icon: Gauge },
  { id: "errors", label: "Errors", icon: AlertTriangle },
];

/* ------------------------------------------------------------------ */
/*  CODE BLOCK COMPONENT                                               */
/* ------------------------------------------------------------------ */
function CodeBlock({
  code,
  language,
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="group relative my-4 rounded-xl border border-[#21262d] bg-[#0d1117] overflow-hidden">
      {/* Header bar */}
      {(title || language) && (
        <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-2">
          <span className="text-xs font-medium text-muted">
            {title || language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-foreground hover:bg-surface-2"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
      {/* Code content */}
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-relaxed text-foreground/90 whitespace-pre">
          {code}
        </pre>
      </div>
      {/* Copy button when no header */}
      {!title && !language && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 rounded-md p-1.5 text-muted opacity-0 transition-all hover:text-foreground hover:bg-surface-2 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HELPER COMPONENTS                                                  */
/* ------------------------------------------------------------------ */
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-500/15 text-green-400 border-green-500/30",
    POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
    PUT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    PATCH: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${
        colors[method] || "bg-surface-2 text-muted border-border"
      }`}
    >
      {method}
    </span>
  );
}

function Endpoint({
  method,
  path,
}: {
  method: string;
  path: string;
}) {
  return (
    <div className="my-4 flex items-center gap-3 rounded-xl border border-border/60 bg-surface/60 px-4 py-3">
      <MethodBadge method={method} />
      <code className="font-mono text-sm text-foreground">{path}</code>
    </div>
  );
}

function ParamTable({
  params,
}: {
  params: { name: string; type: string; required: boolean; description: string }[];
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-surface/60">
            <th className="px-4 py-3 font-semibold text-muted">Parameter</th>
            <th className="px-4 py-3 font-semibold text-muted">Type</th>
            <th className="px-4 py-3 font-semibold text-muted">Required</th>
            <th className="px-4 py-3 font-semibold text-muted">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border/30 last:border-0">
              <td className="px-4 py-3">
                <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-accent">
                  {p.name}
                </code>
              </td>
              <td className="px-4 py-3 text-muted">
                <code className="text-xs">{p.type}</code>
              </td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="text-xs font-semibold text-accent">Required</span>
                ) : (
                  <span className="text-xs text-muted">Optional</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-6 mt-16 flex items-center gap-3 text-2xl font-extrabold tracking-tight text-foreground first:mt-0 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-8 text-lg font-bold text-foreground">{children}</h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-3 text-sm leading-relaxed text-muted">{children}</p>
  );
}

/* ------------------------------------------------------------------ */
/*  DOCS PAGE                                                          */
/* ------------------------------------------------------------------ */
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function scrollTo(id: string) {
    setActiveSection(id);
    setSidebarOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-muted hover:text-foreground lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Flame className="h-5 w-5 text-accent" />
              <span>
                Blaze<span className="text-accent">Crawl</span>
              </span>
            </a>
            <span className="hidden sm:inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              API Docs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Sign In
            </a>
            <a
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Get API Key
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-[90rem] pt-14">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-background">
          <div className="sticky top-14 flex flex-col gap-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 3.5rem)" }}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted/60">
              API Reference
            </p>
            {sections.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    active
                      ? "bg-accent/10 text-accent font-semibold"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                </button>
              );
            })}
            <div className="mt-6 rounded-xl border border-border/60 bg-surface/60 p-4">
              <p className="text-xs font-semibold text-foreground">Base URL</p>
              <code className="mt-1 block text-xs text-accent font-mono">
                https://blazecrawl-dev.web.app
              </code>
            </div>
          </div>
        </aside>

        {/* Sidebar — mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-50 flex w-72 flex-col border-r border-border/60 bg-background h-full overflow-y-auto">
              <div className="flex flex-col gap-1 p-4 pt-20">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted/60">
                  API Reference
                </p>
                {sections.map((s) => {
                  const Icon = s.icon;
                  const active = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        active
                          ? "bg-accent/10 text-accent font-semibold"
                          : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-10 lg:px-16 lg:py-12">
          <div className="mx-auto max-w-3xl">

            {/* ============================================================ */}
            {/*  GETTING STARTED                                             */}
            {/* ============================================================ */}
            <SectionHeading id="getting-started">
              <BookOpen className="h-6 w-6 text-accent" />
              Getting Started
            </SectionHeading>

            <Paragraph>
              BlazeCrawl turns any website into clean, LLM-ready data. Get started in under
              two minutes: create an account, grab your API key, and make your first request.
            </Paragraph>

            <SubHeading>1. Create an Account</SubHeading>
            <Paragraph>
              Head to{" "}
              <a href="/login" className="text-accent hover:underline">
                blazecrawl-dev.web.app/login
              </a>{" "}
              and sign up with your email, Google, or GitHub account. No credit card required.
            </Paragraph>

            <SubHeading>2. Get Your API Key</SubHeading>
            <Paragraph>
              After signing in, navigate to the{" "}
              <strong className="text-foreground">Dashboard</strong> and create a new API key.
              Your key will look like <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-accent">bc_live_xxxxxxxxxxxxxxxx</code>.
              Keep it safe — treat it like a password.
            </Paragraph>

            <SubHeading>3. Make Your First Request</SubHeading>
            <Paragraph>
              Scrape any URL and get markdown back. Here is a complete example:
            </Paragraph>

            <CodeBlock
              language="bash"
              title="Your first scrape"
              code={`curl -X POST https://blazecrawl-dev.web.app/api/v1/scrape \\
  -H "Authorization: Bearer bc_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "markdown"
  }'`}
            />

            <Paragraph>You will receive a JSON response like this:</Paragraph>

            <CodeBlock
              language="json"
              title="Response"
              code={`{
  "success": true,
  "data": {
    "markdown": "# Example Domain\\n\\nThis domain is for use in illustrative examples...",
    "metadata": {
      "title": "Example Domain",
      "description": "Example Domain",
      "statusCode": 200,
      "url": "https://example.com"
    }
  }
}`}
            />

            <Tip>
              The free tier includes 1,000 pages per month with 10 concurrent requests.
              Credits roll over — they never expire.
            </Tip>

            {/* ============================================================ */}
            {/*  AUTHENTICATION                                              */}
            {/* ============================================================ */}
            <SectionHeading id="authentication">
              <Key className="h-6 w-6 text-accent" />
              Authentication
            </SectionHeading>

            <Paragraph>
              All API requests require a Bearer token in the <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-accent">Authorization</code> header.
              You can create and manage API keys from your dashboard.
            </Paragraph>

            <CodeBlock
              title="Authorization Header"
              code={`Authorization: Bearer bc_live_xxxxxxxxxxxxxxxx`}
            />

            <SubHeading>API Key Types</SubHeading>

            <div className="my-4 overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/60">
                    <th className="px-4 py-3 font-semibold text-muted">Prefix</th>
                    <th className="px-4 py-3 font-semibold text-muted">Environment</th>
                    <th className="px-4 py-3 font-semibold text-muted">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-green-400">bc_live_</code>
                    </td>
                    <td className="px-4 py-3 text-muted">Production</td>
                    <td className="px-4 py-3 text-muted">Live API access, metered usage</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-yellow-400">bc_test_</code>
                    </td>
                    <td className="px-4 py-3 text-muted">Test</td>
                    <td className="px-4 py-3 text-muted">Sandbox access, no credits consumed</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Tip>
              Never expose your API key in client-side code. Always call the BlazeCrawl API from your
              backend server or a serverless function.
            </Tip>

            {/* ============================================================ */}
            {/*  SCRAPE                                                      */}
            {/* ============================================================ */}
            <SectionHeading id="scrape">
              <Globe className="h-6 w-6 text-accent" />
              Scrape
            </SectionHeading>

            <Paragraph>
              The Scrape endpoint converts a single URL into clean markdown, HTML, or structured data.
              It handles JavaScript rendering, anti-bot bypassing, and dynamic content automatically.
            </Paragraph>

            <Endpoint method="POST" path="/api/v1/scrape" />

            <SubHeading>Request Body</SubHeading>
            <ParamTable
              params={[
                { name: "url", type: "string", required: true, description: "The URL to scrape" },
                { name: "format", type: "string", required: false, description: "Output format: \"markdown\" (default), \"html\", \"text\", \"screenshot\"" },
                { name: "includeTags", type: "string[]", required: false, description: "Only include content from these CSS selectors" },
                { name: "excludeTags", type: "string[]", required: false, description: "Exclude content matching these CSS selectors" },
                { name: "waitFor", type: "number", required: false, description: "Wait time in ms after page load (for dynamic content)" },
                { name: "timeout", type: "number", required: false, description: "Maximum request timeout in ms (default: 30000)" },
                { name: "headers", type: "object", required: false, description: "Custom HTTP headers to send with the request" },
              ]}
            />

            <SubHeading>Example Request</SubHeading>
            <CodeBlock
              language="bash"
              title="Scrape with options"
              code={`curl -X POST https://blazecrawl-dev.web.app/api/v1/scrape \\
  -H "Authorization: Bearer bc_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://docs.example.com/getting-started",
    "format": "markdown",
    "excludeTags": ["nav", "footer", ".sidebar"],
    "waitFor": 2000
  }'`}
            />

            <SubHeading>Response</SubHeading>
            <CodeBlock
              language="json"
              title="200 OK"
              code={`{
  "success": true,
  "data": {
    "markdown": "# Getting Started\\n\\nWelcome to the documentation...",
    "html": "<h1>Getting Started</h1><p>Welcome to the documentation...</p>",
    "metadata": {
      "title": "Getting Started - Example Docs",
      "description": "Learn how to get started with Example.",
      "language": "en",
      "statusCode": 200,
      "url": "https://docs.example.com/getting-started"
    }
  }
}`}
            />

            <Tip>
              Use <code className="rounded-md bg-surface-2 px-1 py-0.5 text-xs font-mono text-accent">excludeTags</code> to
              remove navigation, footers, and sidebars for cleaner LLM input. This can reduce token
              usage by 30-50%.
            </Tip>

            {/* ============================================================ */}
            {/*  CRAWL                                                       */}
            {/* ============================================================ */}
            <SectionHeading id="crawl">
              <Bot className="h-6 w-6 text-accent" />
              Crawl
            </SectionHeading>

            <Paragraph>
              The Crawl endpoint discovers and scrapes all pages on a website. It follows links,
              respects your configuration, and delivers results via webhook or polling. Ideal for
              indexing an entire docs site or building a knowledge base.
            </Paragraph>

            <SubHeading>Start a Crawl</SubHeading>
            <Endpoint method="POST" path="/api/v1/crawl" />

            <ParamTable
              params={[
                { name: "url", type: "string", required: true, description: "The starting URL to crawl" },
                { name: "maxPages", type: "number", required: false, description: "Maximum pages to crawl (default: 100)" },
                { name: "maxDepth", type: "number", required: false, description: "Maximum link depth from the starting URL (default: 3)" },
                { name: "includePaths", type: "string[]", required: false, description: "Only crawl URLs matching these glob patterns" },
                { name: "excludePaths", type: "string[]", required: false, description: "Skip URLs matching these glob patterns" },
                { name: "format", type: "string", required: false, description: "Output format for each page: \"markdown\" (default), \"html\", \"text\"" },
                { name: "webhook", type: "string", required: false, description: "URL to receive crawl completion notification" },
              ]}
            />

            <SubHeading>Example Request</SubHeading>
            <CodeBlock
              language="bash"
              title="Start a crawl"
              code={`curl -X POST https://blazecrawl-dev.web.app/api/v1/crawl \\
  -H "Authorization: Bearer bc_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://docs.example.com",
    "maxPages": 500,
    "maxDepth": 5,
    "includePaths": ["/docs/*", "/guides/*"],
    "excludePaths": ["/blog/*"],
    "format": "markdown"
  }'`}
            />

            <SubHeading>Response (Crawl Started)</SubHeading>
            <CodeBlock
              language="json"
              title="202 Accepted"
              code={`{
  "success": true,
  "id": "crawl_abc123xyz",
  "url": "https://blazecrawl-dev.web.app/api/v1/crawl/crawl_abc123xyz"
}`}
            />

            <SubHeading>Check Crawl Status</SubHeading>
            <Endpoint method="GET" path="/api/v1/crawl/:id" />

            <CodeBlock
              language="bash"
              title="Poll crawl status"
              code={`curl https://blazecrawl-dev.web.app/api/v1/crawl/crawl_abc123xyz \\
  -H "Authorization: Bearer bc_live_xxx"`}
            />

            <CodeBlock
              language="json"
              title="200 OK — In Progress"
              code={`{
  "success": true,
  "status": "crawling",
  "pagesFound": 142,
  "pagesCrawled": 87,
  "data": [
    {
      "url": "https://docs.example.com/intro",
      "markdown": "# Introduction\\n\\n...",
      "metadata": { "title": "Introduction", "statusCode": 200 }
    }
  ]
}`}
            />

            <Tip>
              Use the <code className="rounded-md bg-surface-2 px-1 py-0.5 text-xs font-mono text-accent">webhook</code> parameter
              instead of polling. BlazeCrawl will POST to your URL when the crawl completes, saving you from
              building a polling loop.
            </Tip>

            {/* ============================================================ */}
            {/*  MAP                                                         */}
            {/* ============================================================ */}
            <SectionHeading id="map">
              <Map className="h-6 w-6 text-accent" />
              Map
            </SectionHeading>

            <Paragraph>
              The Map endpoint discovers every URL on a site without scraping content. It parses
              sitemaps, follows links, and returns a complete URL map. Use this to plan your crawl or
              understand site structure before consuming credits.
            </Paragraph>

            <Endpoint method="POST" path="/api/v1/map" />

            <ParamTable
              params={[
                { name: "url", type: "string", required: true, description: "The website URL to map" },
                { name: "maxUrls", type: "number", required: false, description: "Maximum URLs to discover (default: 1000)" },
                { name: "includePaths", type: "string[]", required: false, description: "Only include URLs matching these patterns" },
                { name: "excludePaths", type: "string[]", required: false, description: "Exclude URLs matching these patterns" },
                { name: "useSitemap", type: "boolean", required: false, description: "Parse sitemap.xml if available (default: true)" },
              ]}
            />

            <SubHeading>Example Request</SubHeading>
            <CodeBlock
              language="bash"
              title="Map a website"
              code={`curl -X POST https://blazecrawl-dev.web.app/api/v1/map \\
  -H "Authorization: Bearer bc_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "maxUrls": 500,
    "includePaths": ["/docs/*"]
  }'`}
            />

            <SubHeading>Response</SubHeading>
            <CodeBlock
              language="json"
              title="200 OK"
              code={`{
  "success": true,
  "count": 47,
  "urls": [
    "https://example.com/docs",
    "https://example.com/docs/getting-started",
    "https://example.com/docs/authentication",
    "https://example.com/docs/api-reference",
    "https://example.com/docs/sdks/python",
    "https://example.com/docs/sdks/node"
  ]
}`}
            />

            <Tip>
              Map is free — it does not consume credits. Use it to discover URLs before crawling, so you
              only pay for the pages you actually need.
            </Tip>

            {/* ============================================================ */}
            {/*  EXTRACT                                                     */}
            {/* ============================================================ */}
            <SectionHeading id="extract">
              <Cpu className="h-6 w-6 text-accent" />
              Extract
            </SectionHeading>

            <Paragraph>
              The Extract endpoint uses AI to pull structured data from any webpage. Define a JSON schema
              and BlazeCrawl will return perfectly formatted data — powered by Claude AI. Ideal for
              price monitoring, lead generation, and data pipelines.
            </Paragraph>

            <Endpoint method="POST" path="/api/v1/extract" />

            <ParamTable
              params={[
                { name: "url", type: "string", required: true, description: "The URL to extract data from" },
                { name: "schema", type: "object", required: true, description: "JSON Schema describing the data structure you want" },
                { name: "prompt", type: "string", required: false, description: "Additional instructions for the AI extraction model" },
                { name: "format", type: "string", required: false, description: "Source format for extraction: \"markdown\" (default), \"html\"" },
              ]}
            />

            <SubHeading>Example Request</SubHeading>
            <CodeBlock
              language="bash"
              title="Extract product data"
              code={`curl -X POST https://blazecrawl-dev.web.app/api/v1/extract \\
  -H "Authorization: Bearer bc_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://store.example.com/product/wireless-headphones",
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "price": { "type": "number" },
        "currency": { "type": "string" },
        "rating": { "type": "number" },
        "reviewCount": { "type": "integer" },
        "inStock": { "type": "boolean" },
        "features": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "prompt": "Extract the main product details from this page."
  }'`}
            />

            <SubHeading>Response</SubHeading>
            <CodeBlock
              language="json"
              title="200 OK"
              code={`{
  "success": true,
  "data": {
    "name": "ProSound Wireless Headphones X3",
    "price": 149.99,
    "currency": "USD",
    "rating": 4.7,
    "reviewCount": 2847,
    "inStock": true,
    "features": [
      "Active noise cancellation",
      "40-hour battery life",
      "Bluetooth 5.3",
      "Multi-device pairing",
      "Foldable design"
    ]
  }
}`}
            />

            <Tip>
              The Extract endpoint costs 5 credits per page (vs 1 for Scrape) because it uses AI
              processing. Use Scrape for simple content and Extract for structured data.
            </Tip>

            {/* ============================================================ */}
            {/*  SDKs                                                        */}
            {/* ============================================================ */}
            <SectionHeading id="sdks">
              <Code className="h-6 w-6 text-accent" />
              SDKs
            </SectionHeading>

            <Paragraph>
              Official SDKs are available for all major languages. Each SDK wraps the REST API with
              idiomatic methods, type safety, automatic retries, and built-in error handling.
            </Paragraph>

            <div className="my-6 grid gap-3 sm:grid-cols-2">
              {[
                { lang: "Python", install: "pip install blazecrawl", pkg: "PyPI" },
                { lang: "Node.js", install: "npm install @blazecrawl/sdk", pkg: "npm" },
                { lang: "Go", install: "go get github.com/blazecrawl/blazecrawl-go", pkg: "Go Modules" },
                { lang: "Rust", install: "cargo add blazecrawl", pkg: "crates.io" },
                { lang: "C#", install: "dotnet add package BlazeCrawl", pkg: "NuGet" },
                { lang: "PHP", install: "composer require blazecrawl/sdk", pkg: "Packagist" },
              ].map((sdk) => (
                <div
                  key={sdk.lang}
                  className="rounded-xl border border-border/60 bg-surface/60 p-4 transition-all hover:border-accent/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{sdk.lang}</span>
                    <span className="text-xs text-muted">{sdk.pkg}</span>
                  </div>
                  <code className="mt-2 block text-xs font-mono text-accent">{sdk.install}</code>
                </div>
              ))}
            </div>

            <SubHeading>Python Example</SubHeading>
            <CodeBlock
              language="python"
              title="Python SDK"
              code={`from blazecrawl import BlazeCrawl

client = BlazeCrawl(api_key="bc_live_xxx")

# Scrape a single page
result = client.scrape(
    url="https://example.com",
    format="markdown"
)
print(result.markdown)

# Crawl an entire site
crawl = client.crawl(
    url="https://docs.example.com",
    max_pages=100,
    format="markdown"
)
for page in crawl.data:
    print(f"{page.url}: {len(page.markdown)} chars")

# Extract structured data
product = client.extract(
    url="https://store.example.com/product/1",
    schema={
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "price": {"type": "number"}
        }
    }
)
print(f"{product.data['name']}: \${product.data['price']}")`}
            />

            <SubHeading>Node.js Example</SubHeading>
            <CodeBlock
              language="typescript"
              title="Node.js / TypeScript SDK"
              code={`import BlazeCrawl from "@blazecrawl/sdk";

const client = new BlazeCrawl({ apiKey: "bc_live_xxx" });

// Scrape a single page
const result = await client.scrape({
  url: "https://example.com",
  format: "markdown",
});
console.log(result.markdown);

// Crawl an entire site
const crawl = await client.crawl({
  url: "https://docs.example.com",
  maxPages: 100,
  format: "markdown",
});
for (const page of crawl.data) {
  console.log(\`\${page.url}: \${page.markdown.length} chars\`);
}

// Extract structured data
const product = await client.extract({
  url: "https://store.example.com/product/1",
  schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      price: { type: "number" },
    },
  },
});
console.log(\`\${product.data.name}: $\${product.data.price}\`);`}
            />

            {/* ============================================================ */}
            {/*  RATE LIMITS                                                 */}
            {/* ============================================================ */}
            <SectionHeading id="rate-limits">
              <Gauge className="h-6 w-6 text-accent" />
              Rate Limits
            </SectionHeading>

            <Paragraph>
              Rate limits are enforced per API key. When you exceed your limit, the API returns a{" "}
              <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-red-400">429 Too Many Requests</code>{" "}
              response with a <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-accent">Retry-After</code> header.
            </Paragraph>

            <div className="my-4 overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/60">
                    <th className="px-4 py-3 font-semibold text-muted">Plan</th>
                    <th className="px-4 py-3 font-semibold text-muted">Requests/min</th>
                    <th className="px-4 py-3 font-semibold text-muted">Concurrent</th>
                    <th className="px-4 py-3 font-semibold text-muted">Pages/month</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 font-medium text-foreground">Free</td>
                    <td className="px-4 py-3 text-muted">20</td>
                    <td className="px-4 py-3 text-muted">10</td>
                    <td className="px-4 py-3 text-muted">1,000</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-3 font-medium text-accent">Pro</td>
                    <td className="px-4 py-3 text-muted">100</td>
                    <td className="px-4 py-3 text-muted">100</td>
                    <td className="px-4 py-3 text-muted">50,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Scale</td>
                    <td className="px-4 py-3 text-muted">1,000</td>
                    <td className="px-4 py-3 text-muted">500</td>
                    <td className="px-4 py-3 text-muted">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SubHeading>Rate Limit Headers</SubHeading>
            <Paragraph>
              Every response includes headers to help you track your usage:
            </Paragraph>

            <CodeBlock
              title="Response headers"
              code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1711500000
Retry-After: 12`}
            />

            <Tip>
              Our SDKs handle rate limits automatically with exponential backoff. If you are using
              the REST API directly, check the <code className="rounded-md bg-surface-2 px-1 py-0.5 text-xs font-mono text-accent">Retry-After</code> header
              and wait before retrying.
            </Tip>

            {/* ============================================================ */}
            {/*  ERRORS                                                      */}
            {/* ============================================================ */}
            <SectionHeading id="errors">
              <AlertTriangle className="h-6 w-6 text-accent" />
              Errors
            </SectionHeading>

            <Paragraph>
              BlazeCrawl uses standard HTTP status codes. All error responses include a JSON body
              with a human-readable message and an error code for programmatic handling.
            </Paragraph>

            <SubHeading>Error Response Format</SubHeading>
            <CodeBlock
              language="json"
              title="Error response"
              code={`{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "The provided URL is not valid or not reachable.",
    "statusCode": 422
  }
}`}
            />

            <SubHeading>Error Codes</SubHeading>
            <div className="my-4 overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/60">
                    <th className="px-4 py-3 font-semibold text-muted">HTTP Status</th>
                    <th className="px-4 py-3 font-semibold text-muted">Code</th>
                    <th className="px-4 py-3 font-semibold text-muted">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { status: "400", code: "BAD_REQUEST", desc: "Request body is malformed or missing required fields" },
                    { status: "401", code: "UNAUTHORIZED", desc: "Missing or invalid API key" },
                    { status: "402", code: "INSUFFICIENT_CREDITS", desc: "Not enough credits. Top up or upgrade your plan." },
                    { status: "403", code: "FORBIDDEN", desc: "API key does not have permission for this action" },
                    { status: "404", code: "NOT_FOUND", desc: "The requested resource (crawl job, etc.) was not found" },
                    { status: "408", code: "TIMEOUT", desc: "The scrape timed out. Increase the timeout parameter." },
                    { status: "422", code: "INVALID_URL", desc: "The provided URL is not valid or not reachable" },
                    { status: "429", code: "RATE_LIMITED", desc: "Too many requests. Check the Retry-After header." },
                    { status: "500", code: "INTERNAL_ERROR", desc: "Something went wrong on our end. Please retry." },
                  ].map((e) => (
                    <tr key={e.code} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3">
                        <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-red-400">
                          {e.status}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-accent">
                          {e.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-muted">{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Tip>
              If you receive a <code className="rounded-md bg-surface-2 px-1 py-0.5 text-xs font-mono text-accent">500 INTERNAL_ERROR</code>,
              please retry with exponential backoff. If the error persists, contact support with the
              request ID from the <code className="rounded-md bg-surface-2 px-1 py-0.5 text-xs font-mono text-accent">X-Request-Id</code> response header.
            </Tip>

            {/* ============================================================ */}
            {/*  BOTTOM CTA                                                  */}
            {/* ============================================================ */}
            <div className="mt-20 rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
              <h3 className="text-xl font-extrabold text-foreground">Ready to start scraping?</h3>
              <p className="mt-2 text-sm text-muted">
                Get 1,000 free pages. No credit card required.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
                >
                  Get Your API Key
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com/blazecrawl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Footer padding */}
            <div className="h-20" />
          </div>
        </main>
      </div>
    </div>
  );
}
