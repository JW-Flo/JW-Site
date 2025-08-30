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

### Second Demo Site (andreysergeevich.me) – Automated Provisioning

This repo also contains a Cloudflare platform showcase (Astro config: `astro.andrey.config.mjs`) using KV, D1, R2, and Turnstile via Pages Functions in `functions/`.

One-shot provisioning + config patch:

```bash
./scripts/provision-andrey.sh
```

What the script does:

1. Ensures Wrangler auth (launches `wrangler login` if needed).
2. Creates KV namespace `VISITS` and appends a `[[kv_namespaces]]` block to `wrangler-andrey.toml`.
3. Creates D1 database `andrey_guestbook`, appends `[[d1_databases]]`, seeds table `entries`.
4. Creates R2 bucket `MEDIA`, appends `[[r2_buckets]]` binding.
5. Leaves Turnstile (captcha) for manual dashboard step.

After running:

1. Create Turnstile site & secret in Cloudflare Dashboard (Security > Turnstile).
2. Add secret as environment variable `TURNSTILE_SECRET_KEY` in the Pages project (do NOT add to toml / commit).
3. Replace placeholder site key in `src-andrey/pages/guestbook.astro`.
4. Build & preview deploy:

```bash
npm run build:andrey
npm run deploy:andrey:preview
```

1. Promote to production:

```bash
npm run deploy:andrey
```

Local dev (functions + static output):

```bash
npm run pages:dev:andrey
```

Feature endpoints/pages:

- `/edge-demo/` – fetches geo, visit counter, R2 list
- `/geo` – edge geo JSON (function)
- `/visits` – KV counter (function)
- `/r2/list` – R2 object listing (function)
- `/guestbook` – D1 + Turnstile-backed guestbook (GET/POST)

Future expansion placeholders (commented in `wrangler-andrey.toml`): Queues, Durable Objects.

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

## License

Personal proprietary unless otherwise specified.
