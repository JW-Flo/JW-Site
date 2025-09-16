# AtlasIT Platform Master Roadmap

## 1. Platform Architecture & Core Services

- **Orchestrator**: Workflow engine, API endpoints, execution tracking, MCP integration
- **IAM/JML Automation**: User onboarding/offboarding, access control, profile sync, provisioning
- **UI Dashboard**: IAM automation, approval flows, audit logs, extensibility
- **Data Stores**: Cloudflare D1, KV, R2, session/cookie management
- **Security Layers**: API keys, rate limiting, input validation, privacy, observability

## 2. Subpages & Products

- **Dashboard**: User/group/app management, workflow status, audit
- **Onboarding**: Persona selection, onboarding flows, reset demo
- **Marketplace**: Integration management, SaaS connectors
- **API Manager**: API key management, endpoint docs
- **Security Center**: Scan, compliance, banners
- **Workflow Builder**: Visual designer, templates, execution
- **Pricing & Tiering**: Feature matrix, provisioning logic
- **Research Engine**: AI-powered market research, sentiment, competitive analysis

## 3. Demo Experience

- **Demo Data Seeding**: Personas, requests, metrics, activity feed
- **Demo Mode Indicators**: Banners, read-only endpoints
- **Reset Demo Controls**: UI + API, KV clearing, rehydration
- **End-to-End Flow Validation**: Integration tests, error handling, edge cases
- **Polish**: UI messaging, tooltips, onboarding tips, walkthroughs

## 4. Deployment & Maintenance

- **Cloudflare Pages/Workers**: Hosting, wrangler config, secret management
- **Automated Scripts**: Demo refresh, KV clearing, rebuilds
- **Documentation**: Deployment steps, environment variables, health checks
- **Performance & Architecture Review**: Bundle size, CI checks, quarterly audits

## 5. Future Enhancements

- **Extensibility**: Add-ons, feature flags, custom SLAs
- **New System Integrations**: SaaS apps, Terraform, Okta, AD, Entra, Google Workspace, KnowBe4
- **Advanced Workflow Logic**: Approval, notification, error handling, audit/reporting
- **AI/ML Research Engine**: Trend analysis, entity extraction, recommendations

---

## IAM/JML Automation Integration Plan

- Okta is the central IdP and source of truth for user lifecycle (Joiner, Mover, Leaver) and group/role assignments.
- Provisioning and deprovisioning are automated via Okta SCIM, API, or pre-built connectors for AWS, Entra ID, AD, Google Workspace, and KnowBe4.
- Workflows:
  - Assign user to Okta group (e.g., "AWS Access", "Azure Access", "AD Access").
  - Okta triggers automation:
    - AWS: Terraform provisions IAM user/role, outputs ARNs/credentials.
    - Entra ID: Okta app or API provisions user/role.
    - AD: Okta AD Agent provisions user/group membership.
    - Google Workspace/KnowBe4: Okta app integration provisions user/group.
  - Outputs/status are visible in AtlasIT dashboard.
  - Removing user from group triggers deprovisioning in all systems.
- All agent tool stubs (provision_user, assign_role, sync_profile) are now available for demo and extension.
- See `atlasit/terraform/aws-iam-demo/IAM_AUTOMATION_OVERVIEW.md` for full workflow details and references.

---

## Recent Milestones (Sep 2025)

    - Demo data seeding logic audited and updated for onboarding, dashboard, and workflow builder
    - Demo reset controls implemented (UI + API, /demo-reset page, linked from index)
    - End-to-end Playwright tests added for demo reset and workflow builder flows
    - Demo mode banners and indicators added to all primary views (global layout, workflow builder, demo reset, AWS IAM demo)
    - Documentation updated in README.md and DEMO_DATA.md to reflect new demo features
    - Okta-centric IAM workflow core wired into IAM automation API (start/advance/sync/reset demo flows)
    - **Backend MCP server fully validated:**
      - All authentication flows (bearer, OAuth) tested and passing
      - SSE endpoint flush logic robust (optional chaining, safe fallback)
      - No runtime errors in latest test runs
      - All endpoints and error handling verified
      - Package.json dependencies and config audited
      - Demo data reset and E2E flows confirmed intact
    - Roadmap and documentation updated for production readiness

---

## Next Phase: Backend/Orchestration Integration (Sep 2025)

- Dashboard vertical slice complete: IAM automation section now shows directory users, workflow status, and integration metadata (read-only)
- Demo reset flow clears IAM data and keeps UI in sync
- Docs updated: DEMO_DATA.md and ROADMAP.md note new IAM surfaces
- **Next steps:**
  - Implement workflow actions (POST endpoints for start/advance/sync)
  - Add orchestrator hooks for workflow execution and status updates
  - Expand E2E coverage for workflow actions and error states
  - Integrate backend logic for provisioning/deprovisioning (Okta, AWS, Entra, AD, Google, KnowBe4)
  - Document new endpoints and flows in OpenAPI spec and README
  - Validate orchestration and dashboard integration before production deployment
  - Continue UI/UX polish and demo mode clarity
  - Align with Codex for phased rollout and feedback

---

### Execution Plan

1. Align with Codex on priorities and deployment strategy
2. Finalize demo flows and seed data for interview walkthroughs
3. Polish UI/UX and ensure demo mode is clear throughout
4. Validate all endpoints, workflows, and integrations
5. Deploy to Cloudflare and verify production readiness
6. Document all steps and update roadmap as features ship

---

*This roadmap is the single source of truth for AtlasIT platform development, demo, and deployment. Update as new features, subpages, or products are added.*
