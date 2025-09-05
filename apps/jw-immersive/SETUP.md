# Project Setup & Deployment Guide

This document defines how to stand up and operate the unified Cloudflare Pages + Functions topology for `jw-site`.

---

## 1. Topology Overview

A single Cloudflare Pages project serves:

- Static Astro build output (`dist/`).
- Functions (API endpoints) from the repository (Pages Functions / Workers runtime).
- Shared Cloudflare bindings (KV, D1, optional R2) exposed to all functions.

If future load isolation is required (e.g., heavier scanning), a dedicated Worker can be introduced; until then, keep one project for simplicity.

---

## 2. Required Cloudflare Resources

Create (production first, then staging) KV namespaces:

```bash
wrangler kv:namespace create RATE_LIMIT --env=production
wrangler kv:namespace create LEADERBOARD --env=production
wrangler kv:namespace create ANALYTICS --env=production
# Optional only if enabling scan metadata persistence:
wrangler kv:namespace create SCANNER_META --env=production

# Staging equivalents:
wrangler kv:namespace create RATE_LIMIT --env=staging
wrangler kv:namespace create LEADERBOARD --env=staging
wrangler kv:namespace create ANALYTICS --env=staging
# Optional:
wrangler kv:namespace create SCANNER_META --env=staging
```

Update the resulting IDs in `wrangler.toml` under the `env.production` and `env.staging` sections (placeholders provided).

### D1 Database (optional / already referenced)

If using D1 (`DB` binding) for consent or guestbook persistence, ensure the database exists via Dashboard or `wrangler d1 create <name>` and update `wrangler.toml` if needed.

---

## 3. Secrets & Sensitive Values

Set per environment (never commit values):

- `SUPER_ADMIN_KEY`
- `SESSION_SIGNING_KEY`
- `GEO_HASH_KEY`
- `NVD_API_KEY` (optional enrichment)
- `VIRUSTOTAL_API_KEY` (optional enrichment)
- `OPENCVE_API_TOKEN` OR (`OPENCVE_BASIC_USER` + `OPENCVE_BASIC_PASS`)
- `ADMIN_UI_INITIAL_PASSWORD` (to bootstrap admin account, if implementing admin UI)

Commands (interactive):

```bash
npx wrangler secret put SUPER_ADMIN_KEY --env=production
npx wrangler secret put SESSION_SIGNING_KEY --env=production
npx wrangler secret put GEO_HASH_KEY --env=production
npx wrangler secret put NVD_API_KEY --env=production
npx wrangler secret put VIRUSTOTAL_API_KEY --env=production
npx wrangler secret put OPENCVE_API_TOKEN --env=production
# or
npx wrangler secret put OPENCVE_BASIC_USER --env=production
npx wrangler secret put OPENCVE_BASIC_PASS --env=production
npx wrangler secret put ADMIN_UI_INITIAL_PASSWORD --env=production
```

Repeat with `--env=staging` for staging values.

Non‑interactive example:

```bash
echo -n 'supersecret' | npx wrangler secret put SUPER_ADMIN_KEY --env=staging
```

List secrets to verify:

```bash
npx wrangler secret list --env=production
```

---

## 4. Local Development

Use `.dev.vars` for local secrets (never commit):

```env
SUPER_ADMIN_KEY=dev-super-admin
SESSION_SIGNING_KEY=dev-session-signing
GEO_HASH_KEY=dev-geo-hash
NVD_API_KEY=
VIRUSTOTAL_API_KEY=
OPENCVE_BASIC_USER=
OPENCVE_BASIC_PASS=
OPENCVE_API_TOKEN=
ADMIN_UI_INITIAL_PASSWORD=change_me
```

Run:

```bash
npx wrangler dev
```

Astro build step (if previewing production build locally):

```bash
npm run build
npx wrangler pages dev ./dist
```

---

## 5. Deployment Workflow

CI Pipeline (recommended order):

1. Install deps: `npm ci`
1. Lint & test: `npm test`
1. Build: `npm run build`
1. Deploy production (manual approval recommended):

```bash
npx wrangler pages deploy dist --branch=main
```

1. Deploy staging (auto on PR merge into staging branch):

```bash
npx wrangler pages deploy dist --branch=staging
```

Ensure the Cloudflare Pages project is linked so branch deploys map to environments (or set custom domains per branch if desired).

---

## 6. Feature Flags

Environment variables (non-secret) may be placed in `[vars]` or the `env.*.vars` sections:

- `FEATURE_CONSENT_D1`
- `FEATURE_GEO_CLASSIFICATION`
- `FEATURE_AGENT`
- `OPENCVE_ENRICH` (true/false)

Set via dashboard for quick toggling in production if preferred.

---

## 7. OpenCVE Auth Precedence

Code should resolve auth header in this order:

1. Basic: if `OPENCVE_BASIC_USER` & `OPENCVE_BASIC_PASS` set → `Authorization: Basic <base64>`
2. Token: if `OPENCVE_API_TOKEN` set → `Authorization: Token <token>`
3. None: anonymous access.

Test expectations will assert Basic overrides Token when both present.

---

## 8. Admin Authentication (Planned)

- Password hashed with Argon2id & stored in KV key `admin:pwdhash`.
- Initial password comes from `ADMIN_UI_INITIAL_PASSWORD` secret; on first successful login, hash persisted; secret may then be rotated or cleared.
- Session cookie signed with `SESSION_SIGNING_KEY` (HMAC SHA-256), HttpOnly, Secure, SameSite=Strict.
- Rate limit login attempts via `RATE_LIMIT` KV.
- Future: optional TOTP secret stored encrypted.

---

## 9. Observability & Logs

Minimal console logs in production; consider enabling Workers Analytics Engine or Logpush for aggregated metrics. Avoid logging secret values.

---

## 10. Rotation & Recovery

- Rotate keys with `wrangler secret put <NAME>` (new value overrides).
- If admin password lost: set new `ADMIN_UI_INITIAL_PASSWORD`, deploy a temporary route `/api/admin/bootstrap` gated by `SUPER_ADMIN_KEY` that replaces stored hash, then remove route.

---

## 11. Next Implementation Tasks

1. Implement OpenCVE Basic auth precedence & tests.
2. Implement admin login routes & session handling.
3. Add CSP headers for security hardening.
4. Build admin dashboard UI.

---

## 12. Quick Checklist

- [ ] KV namespace IDs inserted for staging & production.
- [ ] Secrets set for both envs.
- [ ] `.dev.vars` populated locally.
- [ ] Build succeeds (`npm run build`).
- [ ] Tests green (`npm test`).
- [ ] Deployment commands validated.

---

## 13. Reference Commands

```bash
# Create KV namespace (production)
npx wrangler kv:namespace create RATE_LIMIT --env=production

# List namespaces
echo 'Use dashboard or wrangler api calls (wrangler kv:namespace list)' # (listing command may require API token scopes)

# Deploy staging build
npm run build
npx wrangler pages deploy dist --branch=staging
```

---

## 14. Security Notes

- Do not expose scanner raw output containing potentially sensitive subdomain lists to unauthenticated users.
- Sanitize domain input on scanner API.
- Limit external API concurrency and set timeouts.

---

End of SETUP.md
