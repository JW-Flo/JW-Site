# (Historical) JW-Site Cloudflare Pages Deploy Guide

## 1. Build & Deploy (from project root)

This document is retained only for historical reference. The Astro `jw-immersive` Pages deployment has been fully decommissioned. The production root `https://www.atlasit.pro/` now issues a 308 redirect to the console worker (`/console`).

Former build command (DO NOT USE):

```bash
npx wrangler pages deploy apps/jw-immersive/dist --commit-dirty=true
```

Any attempt to rebuild should be avoided; underlying source was removed.

## 2. Static & SPA Routing

All routing logic has shifted to Cloudflare Workers. Static assets (if re‑introduced) should be served via R2 + Worker or a dedicated minimal Pages project separate from legacy assumptions.

## 3. Config Notes

- `wrangler.toml` must **not** have `kv_namespaces` under `r2_buckets`.
- All secrets and environment variables should be set in the Cloudflare Pages dashboard, not in the repo.
If new persistence is needed for the console, configure bindings directly in the worker configuration (not this historical Pages setup).

## 4. Troubleshooting

- If you see ENOENT or missing file errors, check your working directory and ensure you are in the project root.
Legacy static asset troubleshooting no longer applies. Any missing assets should be added to the console worker bundle or R2.

## 5. Team Handoff

Decommission Status: COMPLETE. No further action required here. See `ASTRO_DEPRECATED.md` for authoritative status.
