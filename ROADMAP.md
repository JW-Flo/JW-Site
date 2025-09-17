# AtlasIT Platform Roadmap

## Recent Completions (2025-09-16)

- Ported Google and Entra OAuth start endpoints to SvelteKit with proper cache headers and error handling.
- Added Vitest unit tests for OAuth URL generation.
- Defined src/app.d.ts with Cloudflare bindings (D1, KV, R2, OAuth secrets) and added example env usage in health endpoint.
- Cleaned up scaffolded demo files with Node-only modules to enable edge-safe SvelteKit build.
- Added minimal "hello" route and /api/health endpoint for deployment verification.
- Replaced onboarding endpoint with typed POST handler, payload validation, structured errors, analytics logging, simulated config.
- Added OAuth starter endpoints for Google Workspace, Microsoft 365, and Entra. Endpoints return consent URL or setup guidance.
- Wired Marketplace buttons to launch OAuth or show config instructions for Google Workspace and Microsoft 365/Entra.
- Updated Marketplace and admin onboarding flows to show actionable error text and avoid non-prod analytics noise.
- Added guestbook endpoint test.
- Created shared packages: edge-utils (crypto/cookie/cache helpers), validation (zod schemas), config (typed env).
- Added lint rule to forbid node:* imports in +server.ts files.
- Added CI check:edge script to grep for Node APIs in edge app.
- Added security headers (CSP, Referrer-Policy, Permissions-Policy) in SvelteKit handle.

## In Progress

- Implement OAuth callbacks (Google/Entra) with feature-flagged token exchange and strict no-store cache headers.
- Implement onboarding API (zod + D1) and tests.
- Wire D1/KV/R2 bindings and secrets in wrangler (staging/prod); verify app.d.ts matches.
- Add Playwright E2E smokes (health, OAuth buttons, onboarding flow).
- Document MCP .well-known config; enforce edge safety by removing nodejs_compat.

## Next Steps / Priorities

- Broader test coverage for all new endpoints and flows.
- Complete OAuth callback handler implementations.
- Continue improving UX, accessibility, and error handling.
- Review and enhance security and performance for new endpoints.
- Keep documentation and change management logs up to date.

## Reference

See MIGRATION_LOG.md for detailed change tracking and file-level history.
