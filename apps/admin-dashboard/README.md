
# AtlasIT Admin Dashboard

This dashboard provides secure analytics and management for [www.atlasit.admin.pro](https://www.atlasit.admin.pro).

## Features

- YubiKey-only authentication (WebAuthn/FIDO2)
- D1 database integration for analytics
- Multi-tenant data isolation and demo mode
- Analytics widgets/graphs (via `/api/analytics` API route)
- Astro + Tailwind

## Structure

- Each tenant's data is containerized and isolated
- Demo mode allows ephemeral tenant data for platform demonstrations

## Analytics API & Widget Integration

- The dashboard fetches analytics events from `/api/analytics`, supporting tenant filtering for multi-tenant isolation.
- Widgets display platform-wide and per-tenant analytics, security alerts, and demo status.

## Related Documentation

- [Platform README](../../atlasit/platform/README.md)
- [Architecture Overview](../../ARCHITECTURE.md)
