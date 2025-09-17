# Migration Log

This log tracks all structural changes, file movements, and deprecations during the AtlasIT platform consolidation. Each entry must include date, path, reason, replacement, and approver.

## Format

```text
[YYYY-MM-DD] [PATH] Reason | Replacement | Approved by
```

## Backfilled Entries (Phases 1-3)

[2025-09-03] /Users/jw/Projects/JW-Site/apps/jw-immersive/astro.config.mjs Added base: '/team/jw/immersive' for path-based routing | N/A (new config) | JW

[2025-09-03] /Users/jw/Projects/JW-Site/apps/jw-immersive/src/layouts/BaseLayout.astro Added navigation bar with links to Projects, Workflows, Demos, About, Resume, Guestbook, Contact | N/A (enhancement) | JW

[2025-09-03] /Users/jw/Projects/JW-Site/apps/marketing/src/layouts/BaseLayout.astro Created with navigation bar linking to home, team JW, immersive, contact | N/A (new file) | JW

[2025-09-03] /Users/jw/Projects/JW-Site/apps/platform/server.js Updated with HTML navigation for home, team JW, immersive | N/A (enhancement) | JW

[2025-09-03] /Users/jw/Projects/JW-Site/apps/jw-immersive/src/components/BioSection.astro Fixed Component import error by importing Timeline component | N/A (bug fix) | JW

[2025-09-03] /Users/jw/Projects/JW-Site/src/components/BioSection.astro Fixed Component import error by importing Timeline component | N/A (bug fix) | JW

[2025-09-03] /Users/jw/Desktop/Project-AtlasIT/docs/# AtlasIT Platform Consolidation & Migra.md Updated branding section to remove external tool references, added architecture, modules, data model, API surface, phases, UI design system, AI usage | N/A (documentation update) | JW

## Future Entries

[2025-09-16] apps/atlasit-sveltekit/ Initialized SvelteKit workspace with Cloudflare adapter and wrangler config | N/A (new workspace) | Codex
[2025-09-16] apps/atlasit-sveltekit/SETUP_SVELTEKIT.md Added setup guide and deployment steps | N/A (documentation) | Codex
[2025-09-16] apps/atlasit-sveltekit/wrangler.toml Added Pages config with .app staging and .pro production SITE_URL | N/A (configuration) | Codex
[2025-09-16] /.github/pull_request_template.md Added PR template with AI Assistance checklist and verification gates | N/A (process) | Codex
[2025-09-16] /CONTRIBUTING.md Added AI usage policy, commit rules, PR gates | N/A (process) | Codex
[2025-09-16] /CODEOWNERS Enforced code ownership for SvelteKit app critical paths | N/A (process) | Codex
[2025-09-16] /docs/AI_PROMPTS.md Added prompt templates for Grok Fast Code | N/A (documentation) | Codex
[2025-09-16] /AI_CONTRIBUTIONS.md Added AI governance policy section | N/A (documentation) | Codex
[2025-09-16] apps/platform/src/pages/api/onboarding.ts Replaced onboarding endpoint with typed POST handler, payload validation, structured errors, analytics logging, simulated config | N/A (refactor/fix) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/google.ts Added OAuth starter endpoint for Google Workspace, returns consent URL or setup guidance | N/A (new feature) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/microsoft365.ts Added OAuth starter endpoint for Microsoft 365, returns consent URL or setup guidance | N/A (new feature) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/entra.ts Added OAuth starter endpoint for Entra, returns consent URL or setup guidance | N/A (new feature) | Codex
[2025-09-16] apps/platform/src/pages/marketplace/google.astro Wired Marketplace button to Google OAuth endpoint, launches OAuth or shows config instructions | N/A (integration) | Codex
[2025-09-16] apps/platform/src/pages/marketplace/microsoft365.astro Wired Marketplace button to Microsoft 365/Entra OAuth endpoint, launches OAuth or shows config instructions | N/A (integration) | Codex
[2025-09-16] apps/platform/src/pages/marketplace/google.astro Updated error handling to show actionable error text, avoid non-prod analytics noise | N/A (UX improvement) | Codex
[2025-09-16] apps/platform/src/pages/marketplace/microsoft365.astro Updated error handling to show actionable error text, avoid non-prod analytics noise | N/A (UX improvement) | Codex
[2025-09-16] apps/jw-immersive/src/test/guestbook.test.ts Added test for guestbook endpoint | N/A (test) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/google/callback.ts Added correlation IDs, sanitized error messaging, and cache controls for OAuth callback | N/A (security/UX) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/entra/callback.ts Hardened callback messaging, analytics payloads, and cache headers | N/A (security/UX) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/google/index.ts Applied no-store cache headers to OAuth start response | N/A (security) | Codex
[2025-09-16] apps/platform/src/pages/api/oauth/entra/index.ts Applied no-store cache headers to OAuth start response | N/A (security) | Codex
[2025-09-16] apps/platform/src/pages/marketplace/google.astro Improved mobile layout, aria semantics, and actionable OAuth alerts | N/A (UX/accessibility) | Codex
[2025-09-16] apps/platform/src/pages/marketplace/microsoft365.astro Improved mobile layout, aria semantics, and actionable OAuth alerts | N/A (UX/accessibility) | Codex
[2025-09-16] apps/platform/src/pages/onboarding.astro Enhanced in-product guidance with aria-live errors, field validation cues, and accessible summaries | N/A (UX/accessibility) | Codex
[2025-09-16] apps/platform/test/oauth.test.ts Expanded coverage for OAuth edge cases, analytics logging, and user messaging | N/A (test) | Codex
[2025-09-16] apps/platform/test/onboarding.test.ts Added invalid JSON, validation, and analytics failure assertions | N/A (test) | Codex
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/demo/ Removed demo routes with Node-only modules (@node-rs/argon2, drizzle-orm, mysql2) to enable edge-safe build | N/A (cleanup for migration MVP) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/hooks.ts Removed paraglide reroute hook | N/A (cleanup) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/hooks.server.ts Simplified to basic handle, removed auth and paraglide middleware | Basic Cloudflare Pages handle | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/lib/server/ Removed auth and db utilities with Node-specific dependencies | N/A (cleanup) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/messages/ Removed paraglide i18n messages | N/A (cleanup) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/project.inlang/ Removed paraglide project config | N/A (cleanup) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/hello/+page.svelte Added minimal hello route for deployment verification | N/A (new route) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/api/health/+server.ts Added health endpoint returning JSON status | N/A (new API) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/app.d.ts Added Cloudflare bindings types for D1, KV, R2, OAuth secrets, and SITE_URL | N/A (type definitions) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/api/health/+server.ts Added example env usage with event.platform.env.SITE_URL | N/A (enhancement) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/SETUP_SVELTEKIT.md Added bindings and types section with app.d.ts example | N/A (documentation) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/api/oauth/google/+server.ts Ported Google OAuth start endpoint from Astro to SvelteKit with event.platform.env | N/A (new endpoint) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/api/oauth/entra/+server.ts Ported Entra OAuth start endpoint from Astro to SvelteKit with event.platform.env | N/A (new endpoint) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/package.json Added Vitest devDependency and test scripts | N/A (testing setup) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/vitest.config.ts Created Vitest config for SvelteKit | N/A (testing config) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/api/oauth/google/+server.spec.ts Added unit tests for Google OAuth URL generation | N/A (tests) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/src/routes/api/oauth/entra/+server.spec.ts Added unit tests for Entra OAuth URL generation | N/A (tests) | Grok+JW
[2025-09-16] /Users/jw/Projects/JW-Site/apps/atlasit-sveltekit/SETUP_SVELTEKIT.md Added testing instructions | N/A (documentation) | Grok+JW
[2025-09-16] apps/atlasit-sveltekit/static/.well-known/mcp-settings.json Added MCP settings endpoint for tool integration | N/A (ops tooling) | Grok+JW

[2025-09-16] apps/atlasit-sveltekit/wrangler.toml Removed nodejs_compat, aligned example bindings to D1_DB/KV_ATLASIT/R2_BUCKET | Edge safety | Grok+JW

[2025-09-16] docs/MIGRATION_PLAN_SVELTEKIT.md Added phased migration roadmap across AtlasIT, Awhittlewandering, JW-Site | Planning | Grok+JW
[2025-09-16] packages/edge-utils/ Created shared package with crypto, cookie, cache helpers | N/A (new package) | Grok+JW
[2025-09-16] packages/validation/ Created shared package with zod schemas | N/A (new package) | Grok+JW
[2025-09-16] packages/config/ Created shared package with typed env config | N/A (new package) | Grok+JW
[2025-09-16] apps/atlasit-sveltekit/eslint.config.js Added no-restricted-imports rule for node:* in +server.ts | Edge safety | Grok+JW
[2025-09-16] package.json Added check:edge script to grep for node: imports | CI hardening | Grok+JW
[2025-09-16] apps/atlasit-sveltekit/src/hooks.server.ts Added CSP, Referrer-Policy, Permissions-Policy headers | Security | Grok+JW

[2025-09-17] apps/atlasit-sveltekit/src/routes/api/iam-automation/+server.ts Replaced proxy with in-memory Paycom->Okta storyline and analytics helpers | N/A (demo data reliability) | Codex
