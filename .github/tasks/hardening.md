# Task: Lock down atlasit.pro, migrate app to atlasit.app, and enforce server-side auth

## Verify-first (do not proceed if already done)

- Search repo and Cloudflare config for:
  - Any client-only auth checks (localStorage/sessionStorage).
  - Routes under `/app/**` on atlasit.pro.
  - Workers/Pages routes bound to atlasit.pro.
- If secure server-side gating already exists, DO NOT duplicate or weaken it. Comment findings and exit.

## Actions

1. Containment

- Create/confirm Cloudflare rules that return 410/403 for atlasit.pro `/app/**`.
- Remove DNS records for <http://www.atlasit.pro> and any dev/stage hosts that expose app surfaces.
- Ensure atlasit.pro serves only static marketing/docs; nothing else.

1. New environment on atlasit.app

- Scaffold SvelteKit app deployment (Workers or Pages Functions).
- Implement server-side session validation in hooks.server.ts using Redis (opaque SID) or D1.
- Set cookies: HttpOnly, Secure, SameSite=Strict, Path=/, Domain per env.
- Add CSP, HSTS, XFO=DENY, Referrer-Policy.
- Add Cloudflare Access for dev/stg hosts.

1. CI/CD & Guardrails

- Terraform for DNS, Rulesets, Access, routes. Idempotent.
- GH Actions: dev->stg->prod with approvals; block pushes to prod without tag.
- Add tests that:
  - GET /app without cookie => 302 /login (server-side).
  - Setting localStorage flags does NOT bypass auth.
  - Security headers present on every response.

## Do not

- Do not keep or re-introduce any client-side auth gates.
- Do not share cookies across envs.
- Do not modify marketing routes/content beyond adding a deprecation banner.

## Deliverables

- PR with IaC + app changes, plus a README containing:
  - Inventory before/after (DNS, routes, access apps).
  - Verification Matrix results.
  - Rollback steps.

## Rollback Plan (document in the PR)

- Re-enable prior DNS + Worker routes from Terraform state for atlasit.pro marketing only; never restore /app/**.
- Disable atlasit.app routes by ruleset deny (kept in code, toggled by variable).
- Sessions: invalidate all sid by namespace purge in Redis/D1+KV.
