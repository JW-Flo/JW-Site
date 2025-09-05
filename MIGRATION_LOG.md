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

Add new entries below as changes are made. All structural changes require an entry here before merge.
