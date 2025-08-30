# Personal Site – Joe Whittle

Static, low-maintenance cybersecurity engineering portfolio + human journey context.

## Stack

- Astro + MDX
- TailwindCSS
- Cloudflare Pages (primary hosting)

## Local Development

```bash
npm install
npm run dev
```

Site at <http://localhost:4321>

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
