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

## Deployment

Push to `main` triggers GitHub Actions workflow `.github/workflows/deploy.yml` which builds & publishes to Pages.

Configure repository Settings > Pages: Source = GitHub Actions.

Update `astro.config.mjs` site URL and `SEO.astro` canonical URL with your actual GitHub username.

## Principles

- Minimal attack surface (static output only)
- Single JSON resume source of truth
- No backend, no database
- Simple, readable code

## Roadmap (optional future)

- Add dark/light toggle via CSS class
- Generate blog index from `import.meta.glob`
- Project data file for easier additions

## License

Personal proprietary unless otherwise specified.
