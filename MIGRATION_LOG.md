# Migration Log

This log tracks all structural changes, file movements, and deprecations during the AtlasIT platform consolidation. Each entry must include date, path, reason, replacement, and approver.

## Format

```
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
