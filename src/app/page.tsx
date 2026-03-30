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
            Start Free &mdash; 1,000 Pages
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
            { label: "10x cheaper", icon: Zap },
            { label: "Zero data retention", icon: Eye },
            { label: "100% open source", icon: Code },
            { label: "Credits never expire", icon: Shield },
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
  { feature: "Pay-per-use pricing", blaze: "Yes", fire: "No \u2014 monthly tiers only", blazeGood: true, fireBad: true },
  { feature: "Credits roll over", blaze: "Yes, forever", fire: "No \u2014 expire monthly", blazeGood: true, fireBad: true },
  { feature: "Social media scraping", blaze: "Yes", fire: "Not supported", blazeGood: true, fireBad: true },
  { feature: "Zero data retention", blaze: "Default for all", fire: "Enterprise only ($$$)", blazeGood: true, fireBad: true },
  { feature: "Self-hosted feature parity", blaze: "100%", fire: "Cloud-only features locked", blazeGood: true, fireBad: true },
  { feature: "Anti-bot stealth mode", blaze: "Included free", fire: "Premium only", blazeGood: true, fireBad: true },
  { feature: "SDKs", blaze: "Python, Node, Go, Rust, C#, PHP", fire: "Python, Node, Go, Rust only", blazeGood: true, fireBad: true },
  { feature: "Rate limit on free tier", blaze: "10 concurrent", fire: "2 concurrent", blazeGood: true, fireBad: true },
  { feature: "robots.txt", blaze: "Configurable", fire: "Always enforced", blazeGood: true, fireBad: false },
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
                      <X className="h-4 w-4" />
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
    title: "Scrape API",
    desc: "One URL in, clean markdown out. Handles JS rendering, anti-bot, dynamic content. 50ms average response.",
  },
  {
    icon: Bot,
    title: "Crawl API",
    desc: "Feed us a domain, we crawl everything. Real-time progress webhooks. Resume failed crawls. No page limits.",
  },
  {
    icon: Map,
    title: "Map API",
    desc: "Discover every URL on a site in seconds. Sitemap parsing + deep link extraction. Build your crawl plan first.",
  },
  {
    icon: Cpu,
    title: "Extract API",
    desc: "Structured data extraction powered by Claude AI. Define your schema, get perfect JSON back. Every time.",
  },
  {
    icon: Share2,
    title: "Social Scrape",
    desc: "Twitter, Reddit, LinkedIn, YouTube \u2014 the platforms others won\u2019t touch. We built it because you asked.",
  },
  {
    icon: Server,
    title: "Self-Host",
    desc: "Docker compose up. That\u2019s it. Full feature parity. No cloud-only gotchas. Your infra, your rules.",
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
          Six APIs. One key. Zero nonsense.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

result = client.scrape(
    url="https://example.com",
    format="markdown"
)

print(result.markdown)
# => "# Example Domain\\n\\nThis domain is for use in ..."`,
  },
  {
    label: "Node.js SDK",
    code: `import BlazeCrawl from "@blazecrawl/sdk";

const client = new BlazeCrawl({ apiKey: "bc_live_xxx" });

const result = await client.scrape({
  url: "https://example.com",
  format: "markdown",
});

console.log(result.markdown);
// => "# Example Domain\\n\\nThis domain is for use in ..."`,
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
const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    pages: "1,000 pages/month",
    concurrent: "10 concurrent",
    support: "Community support",
    badge: null,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    pages: "50,000 pages/month",
    concurrent: "100 concurrent",
    support: "Priority support",
    badge: "Most Popular",
  },
  {
    name: "Scale",
    price: "$99",
    period: "/mo",
    pages: "Unlimited pages",
    concurrent: "500 concurrent",
    support: "Dedicated support + SLA",
    badge: null,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 grid-bg">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Simple, <span className="text-accent glow-text">Honest</span> Pricing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted">
          All tiers: credits roll over, zero data retention, full API access.
          Overage: $0.001/page. No surprise bills.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {tiers.map((t) => {
            const isPro = t.name === "Pro";
            return (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  isPro
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
                  <span className="text-muted">{t.period}</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-sm text-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    {t.pages}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    {t.concurrent}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    {t.support}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Credits never expire
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Zero data retention
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    Full API access
                  </li>
                </ul>
                <a
                  href="/login"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition-colors ${
                    isPro
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "border border-border bg-surface-2 text-foreground hover:bg-surface"
                  }`}
                >
                  {t.name === "Free" ? "Start Free" : `Get ${t.name}`}
                </a>
              </div>
            );
          })}
        </div>

        {/* Callout */}
        <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <p className="text-base font-semibold leading-relaxed">
            Firecrawl charges{" "}
            <span className="text-red-400 font-bold">$83/mo for 100K pages</span> with expiring
            credits. We give you{" "}
            <span className="text-green-400 font-bold">50K for $29</span> with credits that never
            expire.{" "}
            <span className="text-accent font-bold">Do the math.</span>
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
          No credit card required. 1,000 free pages. Forever.
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
