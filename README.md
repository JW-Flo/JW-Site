# Personal Site – Joe Whittle

Static, low-maintenance cybersecurity engineering portfolio + human journey context.

## Stack

- Astro + MDX
- TailwindCSS
- Cloudflare Pages (primary hosting)

## Local Development

### Option 1: Native Node.js (Recommended for development)

```bash
npm install
npm run dev
```

Site at <http://localhost:4321>

### Option 2: Docker (For consistent environments)

```bash
# Build and run with Docker Compose
npm run dev:docker

# Or manually:
docker-compose up

# Or build and run separately:
docker-compose build
docker-compose up -d
```

Site at <http://localhost:4321>

#### Docker Commands

```bash
# Start development server
npm run dev:docker

# Build Docker image
npm run docker:build

# Start in background
npm run docker:up

# Stop containers
npm run docker:down
```

Docker provides a consistent development environment across different machines and ensures all dependencies are properly isolated.

## Content Updates

- Resume: edit `src/data/resume.json`.
- Blog posts: add new `.mdx` files under `src/pages/blog/` with frontmatter.
- Projects: update array in `src/pages/projects.astro` (or later move to data file).

## Deployment (Cloudflare Pages)

You can deploy either through the Cloudflare Pages UI or locally with Wrangler.

### One-time (UI)

1. Create a new Pages project, point at this repo (or upload zip of `dist`).
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set env var `SITE_URL=https://yourdomain.tld` (no trailing slash) once domain is known.
5. After first deploy, add any custom domain; trigger a redeploy so canonical URLs + feeds update.

### Local (Wrangler CLI)

Build then deploy:

```bash
npm run build
npm run deploy:preview   # preview branch deploy
npm run deploy           # production deploy
```

During development you can iterate on the already-built output (rarely needed) with:

```bash
npm run pages:dev
```

Historical note: GitHub Pages was the initial fallback; canonical generation now expects `SITE_URL` to be set for production.

### Staging Workflow

Use a `staging` branch for pre-production validation:

1. Push feature branches & open PRs – CI builds preview deployments (Cloudflare Pages preview environment).
2. Merge into `staging` – automatic staging deploy (configure Cloudflare project to map branch `staging` to staging URL).
3. Final QA on staging URL (security headers, APIs, structured data).
4. Merge staging → main for production deploy.

### Auth (Wrangler OAuth Recommended)

Fast path:

```bash
npm run auth:login
```

What the script does: unsets any `CLOUDFLARE_API_TOKEN` (so Wrangler doesn't force token mode) then launches the browser OAuth flow (`wrangler login`). Credentials are stored under `~/.wrangler`.

Manual steps if you prefer:

```bash
unset CLOUDFLARE_API_TOKEN
npx wrangler login
wrangler whoami
```

If you previously exported a token in your shell profile, remove that line and re-source it before logging in. Avoid pasting API tokens into commits or chat.

## Principles

- Minimal attack surface (static output only)
- Single JSON resume source of truth
- No backend, no database
- Simple, readable code

## Minimal Maintenance Cheatsheet

Add a blog post:

1. Create `src/pages/blog/my-post.mdx`
2. Include frontmatter:

```mdx
---
title: My Post Title
description: Short one-line description.
pubDate: 2025-08-27
---

Content here.
```

1. Commit & push – feed & sitemap update automatically.

Update resume:

1. Edit `src/data/resume.json`
2. Commit & push.

Change canonical domain later:

1. Update `SITE_URL` env var (Cloudflare Pages > Settings > Environment Variables or wrangler.toml vars).
2. Trigger new deploy.

Customize metadata: edit `src/data/siteMeta.ts`.

Things intentionally removed (simplicity):

- Automated JSON schema validation
- MCP settings generator (static file in `public/.well-known/`)
- CI workflow & lint dependencies

Future (optional):

- Dark/light toggle
- Tag filtering for blog
- Reintroduce linting or content validation if needed

## Smoke Tests

Simple script to hit key endpoints (run while dev server is up):

```bash
chmod +x scripts/smoke.sh # first run
./scripts/smoke.sh http://localhost:4321
```

## API Endpoints (Current)

- `GET /api/guestbook` – recent guestbook entries
- `POST /api/guestbook` – add entry (Turnstile token required)
- `GET /api/guestbook/stats` – counts & latest entries
- `GET /api/geo` – Cloudflare edge geo metadata (rate limited)

The previous `/demo` section has been retired. Requests to `/demo` return a 410 page. All functionality now under `/api/*`.

## License

Personal proprietary unless otherwise specified.

## Copyright Notice

© 2025 Joe Whittle. All rights reserved.

This portfolio and its contents, including but not limited to:

- Original game implementations (Space Invaders, Asteroids, Pac-Man, Tetris)
- Security automation workflows
- Resume and professional content
- Website design and code

are the intellectual property of Joe Whittle. All games are original implementations created from scratch and do not copy proprietary game code or assets.

### Game Implementations

All arcade games featured in this portfolio are original JavaScript implementations created by Joe Whittle. They are not based on or copied from any proprietary game engines, code, or assets. The games serve as:

- Interactive portfolio demonstrations
- Technical skill showcases
- Entertainment for visitors
- Examples of modern web development with security considerations

### Usage Rights

- Personal portfolio use: ✅ Permitted
- Educational reference: ✅ Permitted (with attribution)
- Commercial use: ❌ Not permitted without explicit written consent
- Code copying: ❌ Not permitted for commercial purposes

For any questions regarding usage, licensing, or collaboration opportunities, please contact via the contact form or LinkedIn.

---

## Enhanced Security Scanner – Session & Consent

The enhanced scanner issues a short-lived signed session cookie (`escan_s`) strictly for grouping a visitor's scans (HttpOnly, Secure, SameSite=Lax). It contains only a random ID + signature. Signing uses `SESSION_SIGNING_KEY` (configure as secret in Cloudflare Pages). No personal identifiers are embedded.

### Minimal Metadata Packets (KV `SCANNER_META`)

Each scan may generate a tiny JSON packet (<= ~250 bytes):

```json
{ "u": "...", "t": 1735690000000, "m": "business", "f": 12, "c": 2, "s": 87, "co": "US", "ua": "ab12cd" }
```

Field summary:

- `u` – origin + truncated path (no query, no full URL leak)
- `t` – timestamp (ms)
- `m` – mode (business | engineer | super-admin-lite)
- `f` – total findings
- `c` – critical/high finding count
- `s` – overall score (if computed)
- `co` – country code (only with research consent)
- `ua` – one-way hashed User-Agent (only with research consent)

### Consent Gating

Persistence occurs ONLY if a consent cookie `cc_prefs` indicates:

- Analytics: `a:1` OR Research: `r:1`
- Research implies analytics (adds `co` & `ua` fields)

No consent => No metadata persisted (scan still runs; results returned directly).

### Regional Compliance

Client code (cookie banner / CMP) must refrain from setting analytics/research consent values until explicit opt-in for users in regulated jurisdictions (EU GDPR, California). The server trusts the presence/absence of flags – ensure geo + consent logic on the client is correct.

### Environment & Bindings

- KV binding `SCANNER_META` (placeholder IDs in `wrangler.toml`) – replace with real namespace IDs.
- Secret: `SESSION_SIGNING_KEY` (HMAC signing).

### Creating the `SCANNER_META` KV Namespace

The binding is currently commented out to allow deployment without a real namespace. When ready to enable persistence:

1. Create production + preview namespaces:

```bash
wrangler kv:namespace create SCANNER_META --env=production
wrangler kv:namespace create SCANNER_META --env=preview
```

1. Copy the returned `id` and `preview_id` values into `wrangler.toml` under an uncommented block:

```toml
[[kv_namespaces]]
binding = "SCANNER_META"
id = "<prod-id>"
preview_id = "<preview-id>"
```

1. Redeploy. The scanner will begin persisting consent-gated packets.

1. (Optional) To inspect a few recent keys during development:

```bash
wrangler kv:key list --namespace-id <preview-id> | head
```

1. To purge old data manually (normally TTL handles this):

```bash
wrangler kv:key delete --namespace-id <prod-id> <key>
```

Keep namespace small; avoid adding user-identifiable data.

### Data Retention & Size

- KV entries TTL: 24h (lightweight aggregate trend window)
- No IP addresses persisted; no exact full URLs; no raw user agents.

### Extensibility

Future analytics dashboards can query aggregated counts without exposing personal data. Any schema expansion must go through updated consent documentation before deployment.

