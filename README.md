# Personal Site – Joe Whittle

Static, low-maintenance cybersecurity engineering portfolio + human journey context.

## Stack

- Astro + MDX
- TailwindCSS
- GitHub Pages (static hosting)

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

## Deployment (Cloudflare Pages – minimal)

1. Connect repo to Cloudflare Pages.
2. Build command: `npm run build`
3. Output directory: `dist`
4. (Optional) Set an environment variable `SITE_URL=https://yourdomain.tld` once you have a final custom domain. Otherwise fallback `https://jw-flo.github.io/JW-Site` is used for canonical URLs.
5. First deploy; then add your custom domain in Pages settings (if using one) and re-run a build (or just trigger a new deploy) so canonical links update.

GitHub Pages (legacy) still works: just keep `astro.config.mjs` site or set `SITE_URL` during build.

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

1. Set `SITE_URL` in Cloudflare Pages env vars (no trailing slash)
2. Trigger new deploy (or push a commit)

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
