# JW-Site & AWhittleWandering Cloudflare Pages Deploy Guide

## 1. Build & Deploy (from project root)

Always run deploy from the project root (where `wrangler.toml` lives):

```
cd /Users/jw/Projects/JW-Site
npx wrangler pages deploy apps/jw-immersive/dist --commit-dirty=true
```

- This ensures all relative paths resolve correctly and avoids ENOENT errors.
- The `apps/jw-immersive/dist` directory must contain the latest static and SSR build output.

## 2. Static & SPA Routing

- `/awhittlewandering/` and its subpaths are served as static files with SPA fallback (via custom SSR worker patch).
- All other routes are handled by Astro SSR as normal.

## 3. Config Notes

- `wrangler.toml` must **not** have `kv_namespaces` under `r2_buckets`.
- All secrets and environment variables should be set in the Cloudflare Pages dashboard, not in the repo.
- If you add KV or D1, follow the commented instructions in `wrangler.toml`.

## 4. Troubleshooting

- If you see ENOENT or missing file errors, check your working directory and ensure you are in the project root.
- If static assets for AWhittleWandering do not load, verify the worker patch and that the static build output is present in `apps/jw-immersive/dist/awhittlewandering/`.

## 5. Team Handoff

- This process is robust and repeatable for production deploys.
- For further changes, update this guide and the config comments as needed.
