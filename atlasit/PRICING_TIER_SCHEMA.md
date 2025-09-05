# AtlasIT Pricing, Tiering, and DB Schema Mapping

## 1. Pricing & Tier Matrix

| Tier         | Price (USD/user/mo) | User Limit | Integrations | Workflows | Features                                                                 | Support         | Add-ons           |
|--------------|---------------------|------------|--------------|-----------|--------------------------------------------------------------------------|-----------------|-------------------|
| Starter      | $6                  | 10         | 5            | 5         | SSO, MFA, Directory, Basic Workflows, Community Support                  | Community       | None              |
| Essentials   | $12                 | 300        | 50           | 50        | All Starter + Advanced Automation, Compliance, Lifecycle Mgmt, Email     | Email           | Compliance, AI    |
| Professional | $18                 | Unlimited  | Unlimited    | Unlimited | All Essentials + Advanced Security, Analytics, Sandbox, Premium Support  | Premium         | Analytics, Device |
| Enterprise   | Custom              | Unlimited  | Unlimited    | Unlimited | All Professional + API/Device Access, Governance, Advanced Compliance    | Dedicated       | All, Custom SLAs  |

## 2. Feature-to-Tier Mapping

- Starter: SSO, MFA, Directory, Basic Workflows, 5 integrations, 10 users
- Essentials: Adds advanced automation, compliance, lifecycle management, 50 integrations, 300 users
- Professional: Adds advanced security, analytics, unlimited integrations/workflows, sandbox, unlimited users
- Enterprise: Adds API/device access, governance, advanced compliance, custom SLAs, dedicated support, all add-ons

## 3. DB Schema Mapping

- `tenants` table:
  - `id`: UUID
  - `name`: string
  - `tier`: enum ('starter', 'essentials', 'professional', 'enterprise')
  - `user_limit`: int
  - `integration_limit`: int
  - `workflow_limit`: int
  - `features`: array<string> or boolean columns per feature
  - `support_level`: enum

- `users` table:
  - `id`: UUID
  - `tenant_id`: UUID
  - ...existing code...

- `integrations` table:
  - `id`: UUID
  - `tenant_id`: UUID
  - ...existing code...

- `workflows` table:
  - `id`: UUID
  - `tenant_id`: UUID
  - ...existing code...

- `addons` table:
  - `id`: UUID
  - `tenant_id`: UUID
  - `addon_type`: string
  - `enabled`: boolean

## 4. Provisioning Logic

- On tenant creation/update:
  - Set tier, limits, and feature flags
  - Enforce limits via schema constraints and business logic
  - Enable/disable features and add-ons per tier
  - Manage support level and entitlements

## 5. Extensibility

- Add-ons and custom SLAs are tracked in the `addons` table
- Feature flags allow rapid rollout of new features per tier
- Schema supports future tiers and custom enterprise configurations

---
This document is ready for product, engineering, and GTM teams. For further details, see the workflow templates and provisioning scripts.
