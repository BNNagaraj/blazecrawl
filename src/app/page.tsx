"use client";

import {
  Flame,
  Zap,
  Globe,
  Code,
  Shield,
  Server,
  Check,
  X,
  ArrowRight,
  GitFork,
  MessageCircle,
  ExternalLink,
  Lock,
  Eye,
  Cpu,
  Map,
  Bot,
  Share2,
  Search,
  MousePointerClick,
  Layers,
  Terminal,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  NAVBAR                                                            */
/* ------------------------------------------------------------------ */
function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Flame className="h-6 w-6 text-accent" />
          <span>
            Blaze<span className="text-accent">Crawl</span>
          </span>
        </a>

        {/* Links */}
        <div className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </a>
          <a
            href="https://github.com/blazecrawl"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>

        {/* CTA */}
        <a
          href="/login"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Get API Key &mdash; Free
        </a>
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                              */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative grid-bg pt-32 pb-24 overflow-hidden">
      {/* Radial glow behind hero */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
          <Zap className="h-3.5 w-3.5" />
          The #1 Firecrawl Alternative
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          Stop Overpaying for{" "}
          <span className="glow-text text-accent">Web Scraping.</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-up-delay mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          BlazeCrawl turns any website into LLM-ready markdown. Pay-per-use.
          Credits never expire. Zero data retention by default.{" "}
          <span className="text-foreground font-medium">Not just for enterprise.</span>
        </p>

        {/* CTAs */}
        <div className="animate-fade-up-delay-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="/login"
            className="pulse-cta inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Start Free &mdash; 500 Credits
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/blazecrawl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3.5 text-base font-medium transition-colors hover:bg-surface"
          >
            <GitFork className="h-4 w-4" />
            View on GitHub
          </a>
        </div>

        {/* Code block */}
        <div className="animate-fade-up-delay-2 mx-auto mt-14 max-w-3xl text-left">
          <div className="code-block overflow-x-auto p-5 font-mono text-sm leading-relaxed">
            <div className="text-muted mb-2"># Scrape any page in one call</div>
            <div>
              <span className="text-green-400">curl</span>
              <span className="text-foreground"> -X POST https://api.blazecrawl.dev/v1/scrape \</span>
            </div>
            <div>
              <span className="text-foreground">{"  "}-H </span>
              <span className="text-amber-300">{'"Authorization: Bearer bc_live_xxx"'}</span>
              <span className="text-foreground"> \</span>
            </div>
            <div>
              <span className="text-foreground">{"  "}-d </span>
              <span className="text-amber-300">
                {"'{\"url\": \"https://example.com\", \"format\": \"markdown\"}'"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: "8 API Endpoints", icon: Layers },
            { label: "3 SDKs + CLI + MCP", icon: Terminal },
            { label: "< 500ms avg response", icon: Clock },
            { label: "100% open source", icon: Code },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-surface/50 p-4"
            >
              <s.icon className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  COMPARISON TABLE                                                  */
/* ------------------------------------------------------------------ */
const comparisonRows: {
  feature: string;
  blaze: string;
  fire: string;
  blazeGood: boolean;
  fireBad: boolean;
}[] = [
  { feature: "API endpoints", blaze: "8 (incl. Agent)", fire: "7", blazeGood: true, fireBad: true },
  { feature: "SDKs", blaze: "Python, Node.js, CLI, MCP", fire: "Python, Node.js", blazeGood: true, fireBad: true },
  { feature: "Free tier", blaze: "500 credits, 2 concurrent", fire: "500 credits, 2 concurrent", blazeGood: true, fireBad: false },
  { feature: "AI Agent", blaze: "Included in Growth+", fire: "Preview only", blazeGood: true, fireBad: true },
  { feature: "Browser rendering", blaze: "Included", fire: "Included", blazeGood: true, fireBad: false },
  { feature: "Batch scraping", blaze: "Included", fire: "Included", blazeGood: true, fireBad: false },
  { feature: "Self-hostable", blaze: "Yes", fire: "Yes", blazeGood: true, fireBad: false },
  { feature: "Framework integrations", blaze: "LangChain + LlamaIndex", fire: "LangChain + LlamaIndex", blazeGood: true, fireBad: false },
  { feature: "Zero data retention", blaze: "Default for all", fire: "Enterprise only ($$$)", blazeGood: true, fireBad: true },
];

function ComparisonTable() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Why Developers Are <span className="text-accent glow-text">Switching</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">
          A direct, honest comparison. No spin. Just facts.
        </p>

        <div className="mt-12 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-5 py-4 font-semibold text-muted">Feature</th>
                <th className="px-5 py-4 font-bold text-accent">BlazeCrawl</th>
                <th className="px-5 py-4 font-semibold text-muted">Firecrawl</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-border/50 ${i % 2 === 0 ? "bg-surface/30" : ""}`}
                >
                  <td className="px-5 py-3.5 font-medium">{row.feature}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 font-bold text-green-400">
                      <Check className="h-4 w-4" />
                      {row.blaze}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        row.fireBad ? "text-red-400" : "text-muted"
                      }`}
                    >
                      {row.fireBad ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {row.fire}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURES GRID                                                     */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: Globe,
    title: "Scrape",
    desc: "Single URL to clean markdown, HTML, or text. JS rendering, anti-bot bypass, screenshots, and PDF export included.",
  },
  {
    icon: Bot,
    title: "Crawl",
    desc: "BFS crawl with configurable depth and page limits. Fully async with job polling and real-time progress.",
  },
  {
    icon: Map,
    title: "Map",
    desc: "Discover every URL on a site via sitemap parsing and deep link extraction. Build your crawl plan first.",
  },
  {
    icon: Cpu,
    title: "Extract",
    desc: "AI-powered structured data extraction with JSON schema. Powered by Claude. Define your shape, get perfect data.",
  },
  {
    icon: Search,
    title: "Search",
    desc: "Web search plus full page content in a single call. Get search results with scraped markdown, not just links.",
  },
  {
    icon: MousePointerClick,
    title: "Interact",
    desc: "Click, type, scroll, and wait on pages before scraping. Handle auth flows, cookie banners, and dynamic content.",
  },
  {
    icon: Layers,
    title: "Batch",
    desc: "Scrape up to 100 URLs in one request. Webhook callbacks on completion. Parallelized for maximum throughput.",
  },
  {
    icon: Share2,
    title: "Agent",
    desc: "Autonomous AI web research agent. Give it a prompt and a schema, get structured data back. Handles multi-step browsing.",
  },
];

function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6 grid-bg">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything You Need to <span className="text-accent glow-text">Scrape the Web</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">
          Eight APIs. One key. Zero nonsense.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/60 bg-surface/60 p-6 transition-all hover:border-accent/40 hover:bg-surface"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CODE EXAMPLES                                                     */
/* ------------------------------------------------------------------ */
const codeExamples = [
  {
    label: "Python SDK",
    code: `from blazecrawl import BlazeCrawl
client = BlazeCrawl(api_key="bc_live_xxx")

# Scrape a page
result = client.scrape("https://example.com")
print(result["data"]["markdown"])

# AI-powered extraction
data = client.extract("https://example.com", schema={"title": "string", "price": "number"})
print(data["data"]["extracted"])`,
  },
  {
    label: "Node.js SDK",
    code: `import { BlazeCrawl } from 'blazecrawl';
const client = new BlazeCrawl({ apiKey: 'bc_live_xxx' });

// Scrape a page
const result = await client.scrape('https://example.com');
console.log(result.data.markdown);

// AI-powered extraction
const data = await client.extract('https://example.com', {
  schema: { title: 'string', price: 'number' }
});
console.log(data.data.extracted);`,
  },
  {
    label: "cURL",
    code: `curl -X POST https://api.blazecrawl.dev/v1/scrape \\
  -H "Authorization: Bearer bc_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "markdown"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "markdown": "# Example Domain\\n\\n...",
#     "metadata": { "title": "Example Domain", "statusCode": 200 }
#   }
# }`,
  },
];

function CodeExamples() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Integrate in <span className="text-accent glow-text">Minutes</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">
          SDKs for every major language. Or just use cURL.
        </p>

        <div className="mt-12 space-y-8">
          {codeExamples.map((ex) => (
            <div key={ex.label}>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-accent">
                <Code className="h-3 w-3" />
                {ex.label}
              </div>
              <div className="code-block overflow-x-auto p-5 font-mono text-sm leading-relaxed">
                <pre className="whitespace-pre text-foreground/90">{ex.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PRICING                                                           */
/* ------------------------------------------------------------------ */
const allTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "500 credits/mo",
    concurrent: "2 concurrent",
    features: "Scrape, Crawl, Map",
    badge: null,
    visible: true,
  },
  {
    name: "Hobby",
    price: "$16",
    period: "/mo",
    credits: "3,000 credits/mo",
    concurrent: "5 concurrent",
    features: "+ Extract, Search",
    badge: null,
    visible: false,
  },
  {
    name: "Standard",
    price: "$83",
    period: "/mo",
    credits: "100,000 credits/mo",
    concurrent: "50 concurrent",
    features: "+ Batch, Interact",
    badge: "Most Popular",
    visible: true,
  },
  {
    name: "Growth",
    price: "$333",
    period: "/mo",
    credits: "500,000 credits/mo",
    concurrent: "100 concurrent",
    features: "+ Agent",
    badge: null,
    visible: true,
  },
  {
    name: "Scale",
    price: "$599",
    period: "/mo",
    credits: "1,000,000 credits/mo",
    concurrent: "150 concurrent",
    features: "Everything",
    badge: null,
    visible: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    credits: "Unlimited credits",
    concurrent: "500 concurrent",
    features: "+ SSO, SLA, Zero-retention",
    badge: null,
    visible: true,
  },
];

function Pricing() {
  const visibleTiers = allTiers.filter((t) => t.visible);

  return (
    <section id="pricing" className="py-24 px-6 grid-bg">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple, <span className="text-accent glow-text">Honest</span> Pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">
          All tiers: credits roll over, zero data retention, full API access.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleTiers.map((t) => {
            const isPopular = t.badge === "Most Popular";
            return (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  isPopular
                    ? "border-accent/60 bg-surface glow-orange"
                    : "border-border/60 bg-surface/60 hover:border-accent/30"
                }`}
              >
                {t.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-white">
                    {t.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{t.price}</span>
                  {t.period && <span className="text-muted">{t.period}</span>}
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    {t.credits}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    {t.concurrent}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    {t.features}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Credits never expire
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Zero data retention
                  </li>
                </ul>
                <a
                  href={t.name === "Enterprise" ? "mailto:sales@blazecrawl.dev" : "/login"}
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition-colors ${
                    isPopular
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border border-border bg-surface-2 text-foreground hover:bg-surface"
                  }`}
                >
                  {t.name === "Free"
                    ? "Start Free"
                    : t.name === "Enterprise"
                      ? "Contact Sales"
                      : `Get ${t.name}`}
                </a>
              </div>
            );
          })}
        </div>

        {/* See all plans link */}
        <div className="mt-8 text-center">
          <a
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
          >
            See all 6 plans
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Callout */}
        <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <p className="text-base font-semibold leading-relaxed">
            Firecrawl charges{" "}
            <span className="text-red-400 font-bold">$83/mo for 100K credits</span> with expiring
            credits. We match that at{" "}
            <span className="text-green-400 font-bold">$83/mo for 100K credits</span> with credits
            that never expire and more APIs included.{" "}
            <span className="text-accent font-bold">Same price. More value.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BUILT DIFFERENT — Trust signals                                   */
/* ------------------------------------------------------------------ */
const trustSignals = [
  {
    icon: Code,
    title: "100% Open Source",
    desc: "MIT License. Read every line. Fork it. Own it.",
  },
  {
    icon: Eye,
    title: "Zero Data Retention",
    desc: "Your scrapes, your data, deleted after delivery.",
  },
  {
    icon: Shield,
    title: "99.9% Uptime SLA",
    desc: "Even on the free tier. We put it in writing.",
  },
  {
    icon: Lock,
    title: "SOC 2 Compliant",
    desc: "Enterprise-ready from day one. No upgrade required.",
  },
];

function BuiltDifferent() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Built <span className="text-accent glow-text">Different</span>
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trustSignals.map((s) => (
            <div key={s.title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FINAL CTA                                                         */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="relative py-28 px-6 grid-bg overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[700px] rounded-full bg-accent/5 blur-[140px]" />
      </div>
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Stop Burning Money on{" "}
          <span className="text-accent glow-text">Expiring Credits</span>
        </h2>
        <p className="mt-6 text-lg text-muted">
          Join 10,000+ developers who switched to BlazeCrawl.
        </p>
        <a
          href="/login"
          className="pulse-cta mt-10 inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-accent-hover"
        >
          Get Started Free
          <ArrowRight className="h-5 w-5" />
        </a>
        <p className="mt-5 text-sm text-muted">
          No credit card required. 500 free credits. Forever.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                            */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-border/60 py-12 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 text-sm font-bold">
          <Flame className="h-5 w-5 text-accent" />
          Blaze<span className="text-accent">Crawl</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <a href="/docs" className="transition-colors hover:text-foreground">Docs</a>
          <a href="/docs" className="transition-colors hover:text-foreground">API Reference</a>
          <a href="https://status.blazecrawl.dev" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Status</a>
          <a href="https://github.com/blazecrawl" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <GitFork className="h-3.5 w-3.5" /> GitHub
          </a>
          <a href="https://discord.gg/blazecrawl" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" /> Discord
          </a>
          <a href="https://x.com/blazecrawl" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <MessageCircle className="h-3.5 w-3.5" /> Twitter
          </a>
        </div>

        {/* Tagline */}
        <p className="text-xs text-muted/60">
          &copy; {new Date().getFullYear()} BlazeCrawl &middot; Made with rage against overpriced APIs
        </p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                              */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ComparisonTable />
        <FeaturesGrid />
        <CodeExamples />
        <Pricing />
        <BuiltDifferent />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
