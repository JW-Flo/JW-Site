# AtlasIT Platform Roadmap

## Recent Completions (2025-09-16)

- Replaced onboarding endpoint with typed POST handler, payload validation, structured errors, analytics logging, simulated config.
- Added OAuth starter endpoints for Google Workspace, Microsoft 365, and Entra. Endpoints return consent URL or setup guidance.
- Wired Marketplace buttons to launch OAuth or show config instructions for Google Workspace and Microsoft 365/Entra.
- Updated Marketplace and admin onboarding flows to show actionable error text and avoid non-prod analytics noise.
- Added guestbook endpoint test.

## In Progress

- Implement Google Workspace and Microsoft 365/Entra OAuth callbacks with error handling, analytics, and user feedback.
- Expand tests for onboarding and OAuth flows, covering success/error scenarios and analytics logging.
- Polish marketplace/admin UI messaging for OAuth status and ensure accessibility tweaks.
- Update documentation/comments and note performance/security considerations.

## Next Steps / Priorities

- Broader test coverage for all new endpoints and flows.
- Complete OAuth callback handler implementations.
- Continue improving UX, accessibility, and error handling.
- Review and enhance security and performance for new endpoints.
- Keep documentation and change management logs up to date.

## Reference

See MIGRATION_LOG.md for detailed change tracking and file-level history.
