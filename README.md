# BlazeCrawl

**The Web Scraping API That Doesn't Rip You Off.**

Turn any website into LLM-ready markdown. Pay-per-use. Credits never expire. Zero data retention by default.

## Why BlazeCrawl?

| Feature | BlazeCrawl | Firecrawl |
|---------|-----------|-----------|
| Pay-per-use pricing | Yes | No — monthly tiers only |
| Credits roll over | Yes, forever | No — expire monthly |
| Zero data retention | Default for all | Enterprise only |
| Anti-bot stealth mode | Included free | Premium only |
| SDKs | Python, Node, Go, Rust, C#, PHP | Python, Node, Go, Rust only |
| Rate limit on free tier | 10 concurrent | 2 concurrent |

## API Endpoints

- **POST `/api/v1/scrape`** — Scrape a single URL into markdown, HTML, or text
- **POST `/api/v1/crawl`** — Crawl an entire website with depth/page limits
- **GET `/api/v1/crawl/:id`** — Check crawl job status
- **POST `/api/v1/map`** — Discover all URLs on a site (free, no credits consumed)
- **POST `/api/v1/extract`** — AI-powered structured data extraction using Claude

## Quick Start

```bash
curl -X POST https://blazecrawl-dev.web.app/api/v1/scrape \
  -H "Authorization: Bearer bc_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "format": "markdown"}'
```

## Self-Hosting

See [SELF_HOST.md](SELF_HOST.md) for instructions on running BlazeCrawl on your own infrastructure.

```bash
# Quick start with Docker
cp .env.example .env
# Edit .env with your Firebase and Anthropic API keys
docker compose up
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS
- **Backend**: Firebase Cloud Functions (Node.js 22), Express
- **Database**: Cloud Firestore
- **Auth**: Firebase Auth (Email/Password + Google OAuth)
- **AI**: Anthropic Claude (for Extract API)
- **Scraping**: JSDOM, Readability, Turndown

## Project Structure

```
blazecrawl/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx        # Auth page
│   │   ├── dashboard/            # Dashboard (API keys, usage, playground)
│   │   ├── docs/page.tsx         # API documentation
│   │   └── api/v1/              # Next.js API routes (local dev)
│   └── lib/                     # Firebase config, auth, scraper utilities
├── functions/
│   └── index.ts                 # Cloud Functions API (production)
├── firebase.json                # Firebase hosting + functions config
├── firestore.rules              # Security rules
└── .env.example                 # Environment variable template
```

## Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client SDK config
- `ANTHROPIC_API_KEY` — For the Extract API endpoint

## Pricing

| Plan | Price | Pages/month | Concurrent |
|------|-------|-------------|------------|
| Free | $0 | 1,000 | 10 |
| Pro | $29/mo | 50,000 | 100 |
| Scale | $99/mo | Unlimited | 500 |

All tiers: credits never expire, zero data retention, full API access.

## Contributing

We welcome contributions! Please open an issue or submit a pull request.

## License

AGPL-3.0 — See [LICENSE](LICENSE) for details.
