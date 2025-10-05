# Copilot Instructions (JW-Site Wrapper)

Canonical Reference
AWhittleWandering/.github/copilot-instructions.md governs invariants.

Frontend Nuance
- All API config consumption via /api/v1/config (no direct env reads).
- Large media → external (R2); keep repo assets lightweight.
- CSS or design tokens centralize under src/styles/tokens/.

Change Feed
Read-only consumer of canonical live-change-log.ndjson.

Local Overrides
(none)

Agent Context
- Read-only adherence to canonical Section 13.
- Frontend changes requiring new roles must first extend agents-manifest in canonical repo.

