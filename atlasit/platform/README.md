# AtlasIT Platform

This directory contains the core platform logic, analytics, and D1 database schema for the AtlasIT system.

## Key Files

- `d1-schema.sql`: D1 database schema for analytics events
- `api-manager/`: API gateway and routing logic
- `applications/`: SaaS integrations
- `auth/`: Authentication service
- `marketplace/`: App store & integrations
- `onboarding/`: AI-guided tenant setup
- `orchestrator/`: Event orchestration (MCP)
- `platform/`: Main platform code
- `shared/`: Shared utilities
- `terraform/`: Infrastructure as code
- `ui/`: React dashboard

## Analytics & Multi-Tenant Isolation

- Analytics events are tracked platform-wide and stored in D1.
- Multi-tenant data isolation is enforced for all demo and real tenants.
- Admin dashboard at `/apps/admin-dashboard/` provides secure analytics review and management.

## See Also

- [d1-schema.sql](./d1-schema.sql) for database schema
- [../admin-dashboard/README.md](../../apps/admin-dashboard/README.md) for admin dashboard details
- [../docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for architecture overview
