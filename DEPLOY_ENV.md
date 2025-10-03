# JW-Site Deployment Environment Reference

## Overview

This project deploys the `jw-immersive` Astro application to Cloudflare Pages. The build output path is `apps/jw-immersive/dist` (see `wrangler.toml` `pages_build_output_dir`).

## Required Secrets (GitHub Actions)

| Secret | Purpose | Minimum Cloudflare Scopes |
|--------|---------|---------------------------|
| CF_API_TOKEN | Auth for Pages deploy (can reuse same `WRANGLER_API_TOKEN` if it also has Pages:Edit scope) | Account:Cloudflare Pages (Edit) |
| CF_ACCOUNT_ID | Account identifier | N/A (static value) |

Add in GitHub repository Settings → Secrets and variables → Actions.

## Optional Runtime Variables (set in Pages Dashboard > Environment Variables)

| Variable | Description |
|----------|-------------|
| SITE_URL | Canonical site URL (production env sets <https://www.atlasit.pro>) |
| FEATURE_* flags | Toggles for consent D1, geo classification, waitlist, agent mode |
| SUPER_ADMIN_KEY / CONSENT_ADMIN_KEY | Privileged API routes (set as Secrets) |
| TURNSTILE_SECRET_KEY / PUBLIC_TURNSTILE_SITE_KEY | Turnstile captcha integration |
| ANALYTICS_WEBHOOK_URL / ANALYTICS_API_KEY | Optional analytics hooks |

## Local Build

```bash
npm ci
npm run build --workspace @atlasit/jw-immersive
```

## Manual Deploy (Fallback)

```bash
npx wrangler pages deploy apps/jw-immersive/dist --branch main --project-name jw-site
```

## Verification

```bash
curl -I https://www.atlasit.pro/team/jw/immersive/
```

Expect HTTP 200 and HTML Content-Type.

## Rollback

Re-run deploy for previously known good commit or restore artifact via older workflow run.

## Future Enhancements

- Add Playwright smoke tests stage prior to deploy.
- Add Lighthouse CI performance budget gating.
- Add automated sitemap ping to search engines post-deploy.

---

## Deprecation Notice (Astro jw-immersive)

The original `jw-immersive` Astro Pages deployment is deprecated and disabled. See `ASTRO_DEPRECATED.md` for details. All interactive dashboard functionality has migrated to the `atlasit-console` worker (routes: `/console*`, `/access-requests*`, `/incidents*`, `/api/config*`, `/api/mock/*`).

Required secrets now focus on Worker deployments:

- `WRANGLER_API_TOKEN` (Workers + Pages scopes if you retain any Pages project)
- `CF_ACCOUNT_ID`
- (Optional) `CF_API_TOKEN` only if re-enabling Pages.

If you re-enable Astro, remove the `if: false` in `.github/workflows/deploy-pages.yml`.
