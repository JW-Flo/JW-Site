# SvelteKit Migration Plan (AtlasIT, Awhittlewandering, JW-Site)

Date: 2025-09-16

Approved by: Grok+JW

## Goals

- Migrate apps to SvelteKit on Cloudflare Pages/Workers with edge-safe code.
- Unify env bindings (D1/KV/R2) and typed access via `event.platform.env`.
- Improve reliability, test coverage, and docs while preserving demo parity.

## Principles

- Edge-only (no Node APIs); remove `nodejs_compat`.
- Keep changes incremental and test-backed.
- Use zod for validation, global fetch/Web Crypto.
- One root lockfile; workspace installs via `-w`.

## Phases

### Phase A — AtlasIT (current)

1. Baseline

- [x] Adapter-cloudflare, pages output, edge runtime.
- [x] Health endpoint and hello page.
- [x] app.d.ts bindings, wrangler vars.
- [x] OAuth start endpoints (Google, Entra) + unit tests.
- [x] Remove nodejs_compat.

2. Callbacks & Onboarding

- [ ] OAuth callbacks: `/api/oauth/google/callback`, `/api/oauth/entra/callback` (feature-flag token exchange, no-store caching, state cookie check, redirect to success/error).
- [ ] Onboarding API: `/api/onboarding` with zod schema, D1 persistence, structured validation errors.
- [ ] Add minimal pages: marketplace tiles with connect buttons, admin shell, JML demo surface.

3. Data & Bindings

- [ ] Create D1 database and schema migrations for onboarding entities.
- [ ] Add KV (`KV_ATLASIT`) and R2 (`R2_BUCKET`) bindings in wrangler.
- [ ] Secrets: OAUTH_* per provider; SITE_URL for staging/prod.

4. Testing & CI

- [ ] Vitest: schema validation, onboarding handler, OAuth callbacks.
- [ ] Playwright E2E: health smoke, OAuth start buttons, onboarding happy path.
- [ ] Root scripts: ensure `npm run test` and typecheck pass across monorepo.

5. Docs & Process

- [ ] Update SETUP_SVELTEKIT.md (bindings, dev/build/deploy, tests).
- [ ] Update ARCHITECTURE.md with SvelteKit endpoints and data flow.
- [ ] Update ROADMAP.md, MIGRATION_LOG.md, AI_CONTRIBUTIONS.md.

### Phase B — Awhittlewandering

Approach: parallel SvelteKit app or progressive migration.

- [ ] Scaffold `apps/awhittlewandering-sveltekit` with same patterns.
- [ ] Health endpoint and MCP `.well-known` exposure.
- [ ] Integrate Hono Worker API (keep existing) via fetch from SvelteKit.
- [ ] Shared utilities to `packages/` or app `src/lib`, ensuring edge-safety.
- [ ] D1/KV/R2 bindings and typed env; tests and docs similar to AtlasIT.

### Phase C — JW-Site (jw-immersive, marketing)

- [ ] Decide: consolidate vs per-app SvelteKit.
- [ ] If per-app, scaffold each with Cloudflare adapter and bindings.
- [ ] Port public pages and guestbook/waitlist APIs; ensure Turnstile and rate-limits via KV.
- [ ] E2E smokes and unit tests.

## Risks

- Hidden Node dependencies (blocked by removing nodejs_compat).
- OAuth mismatch in redirect URIs across environments.
- Data model drift during onboarding migration.

## Acceptance Criteria (per phase)

- Build passes without Node APIs.
- Unit tests pass; Playwright smoke runs in CI.
- OAuth endpoints produce actionable URLs; callbacks handle errors with no-store.
- Onboarding persists to D1 with validated payloads.
- Docs and logs updated.

## Next Actions

- Implement OAuth callbacks with unit tests.
- Implement onboarding API (zod + D1) and tests.
- Prepare marketplace and admin shell pages.
