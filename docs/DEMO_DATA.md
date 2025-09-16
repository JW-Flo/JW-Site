# AtlasIT Demo Data Playbook

This guide describes how the shared demo dataset is seeded, where it is consumed, and how to refresh it for future walkthroughs.

## Data sources

- **Dataset file:** `src/data/demoData.ts`
  - Defines reusable `demoUsers`, `onboardingRequests`, `dashboardMetrics`, and `activityFeed` arrays.
  - Exports helper `getDemoUserById` for API handlers that accept an optional `demoUserId`.
- **API surface:** `src/pages/api/demo/data.ts`
  - Returns the structured demo payload for UI clients.
  - Used by both the dashboard (`/dashboard`) and onboarding (`/onboarding`) pages to stay in sync.
- The endpoint is read-only and always serves in-memory data bundled with the build; it never reaches out to production services or modifies persistent stores. POST requests return HTTP 405.

### IAM Automation Service

- Endpoint: `atlasit/ui/api/iam-automation.ts`
  - `GET ?type=users` returns Okta-centric directory users.
  - `GET ?type=integrations` returns integration metadata (AWS, Entra, AD, Google, KnowBe4).
  - `GET ?type=workflows` returns active joiner/mover workflows.
- `POST` actions:
  - `start-workflow` `{ userId, systems?, requester? }` seeds a multi-system Okta workflow (defaults to all downstream systems).
  - `advance-workflow` `{ workflowId, system, outcome?, note? }` simulates provisioning completion or failure.
  - `sync-groups` `{ userId, groups }` updates Okta group membership for the demo dataset.
  - `reset` restores the entire IAM automation state to defaults.
- The service uses Okta as source of truth and mirrors the steps described in `IAM_AUTOMATION_OVERVIEW.md` for AWS, Entra ID, Active Directory, Google Workspace, and KnowBe4.

## Demo mode indicator

- Every primary view (dashboard, onboarding, marketplace, security center, workflows, pricing, etc.) displays a "Demo Mode" banner so reviewers immediately understand the environment is non-production.
- The banner text is consistent across pages and should accompany any future additions to the demo site.

## Updating demo content

1. Edit `src/data/demoData.ts` to add or adjust personas, pipeline requests, or high-level metrics.
2. Run `npm run lint` and `npm run build` (or `npm run dev`) to verify the data compiles and the UI renders as expected.
3. Commit the changes or redeploy the Worker/Static site to propagate the new dataset.

Tips:

- Keep `tenantId` unique per persona so onboarding auto-fill continues to work.
- Update the `relativeTime` text in `activityFeed` whenever you change timestamps for consistency during demos.

## Resetting demo runs

The quickest option is the **Reset Demo Data** control exposed on both `/dashboard` and `/onboarding`. It calls `POST /api/demo/reset`, which:

- Rehydrates the IAM automation mock API (`atlasit/ui/api/iam-automation.ts`) back to the seeded state.
- Attempts to delete every `onboarding:<tenantId>` key from the configured KV namespace so the onboarding flow restarts cleanly.
- Refreshes UI widgets automatically so personas, requests, and KPIs reflect baseline values.

If you prefer to run the reset manually (for example from CI or a script):

```bash
curl -X POST http://localhost:4321/api/demo/reset
```

For environments without KV bindings, the endpoint still refreshes in-memory stores. When running locally without the Cloudflare runtime, restarting the dev server also clears state.

You can still target individual tenants in KV manually if needed:

```bash
wrangler kv:key delete --binding=KV onboarding:<tenantId>
```

(or use the Cloudflare dashboard to delete the key.)

## Deploying & updating demo data

- Run `npm run demo:refresh` to rebuild the workspace and (optionally) clear remote KV keys.
- Deploy with `npm run deploy:production` (requires `CF_PAGES_PROJECT`, optionally `CF_PAGES_BRANCH`, `CF_PAGES_DIST_DIR`, and `DEPLOY_HEALTHCHECK_URL`).
- Deploy the updated assets via your normal pipeline (e.g. `wrangler deploy`, GitHub Actions).
- After deployment, trigger the reset endpoint once (`POST /api/demo/reset`) to ensure the running Worker reloads seed data.
- Keep `docs/DEMO_DATA.md` and `src/data/demoData.ts` in sync when adding new personas or metrics so later refreshes remain deterministic.

## Adding new personas or metrics

- Demo users: append to the `demoUsers` array with realistic fields (role, department, status, persona).
- Workflow requests: extend `onboardingRequests`; the dashboard and onboarding pages render the list automatically.
- Dashboard metrics: update `dashboardMetrics` to adjust KPI cards, automation coverage, provisioning SLAs, and populate `trends` data (`weeklyActiveUsers`, `monthlySecurityScore`, etc.) for longer-term KPIs.

After editing, reload `/onboarding` and `/dashboard` to confirm:

- The persona selector is populated and auto-fills the onboarding form.
- The dashboard tables, pipeline list, and KPI badges reflect the new values.
- Trend arrays can power charts or sparklines—update them whenever you change long-range narratives so weekly/monthly deltas stay realistic.

Keep this file close to your updates so future demo prep is a quick review instead of a spelunking exercise.

---

## Demo Mode & Reset Controls (Sep 2025)

## E2E Test Coverage Plan (Sep 2025)

- **Workflow Actions:**
  - Start workflow for a user and verify initial step states (pending, waiting for orchestrator)
  - Advance workflow steps for each system (Okta, AWS, Entra, AD, Google, KnowBe4) and verify state transitions (provisioning, completed, removed, error)
  - Sync groups and verify user group membership updates
  - Reset IAM automation state and confirm all workflows/users return to baseline
- **Error Handling:**
  - Advance workflow with invalid workflowId/system and expect error response
  - Simulate error outcome and verify workflow status updates to failed
- **Orchestration Events:**
  - Verify logs record context for provisioning/deprovisioning actions
  - Confirm dashboard reflects live workflow status and error states
- **Demo Mode:**
  - Ensure demo mode banners and reset controls are visible and functional across all relevant pages

These scenarios should be implemented in Playwright E2E tests for robust coverage and future regression protection.

---
