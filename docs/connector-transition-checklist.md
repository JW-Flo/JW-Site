# Connector Transition Checklist

Use this playbook when promoting simulated AtlasIT connectors to production tenants. Follow the general steps, then apply the connector-specific work items below to keep the experience minimally manual.

## General Transition Flow

1. **Load credentials from vault/KV**
   - Store production secrets (API tokens, client IDs/secrets) in your secret manager.
   - Use Wrangler Secrets or your deployment pipeline to inject the values as environment variables for the orchestrator and Marketplace UI.
2. **Register production auth**
   - Call `AuthenticationManager.registerAuth(systemName, config)` with the production configuration when the tenant is provisioned.
   - Remove or guard `registerSimulatedConnectorAuth` for production tenants so simulation fallbacks do not load accidentally.
3. **Override workflow resources**
   - Provide a `connectorResources` map (per tenant) when constructing `OktaStyleWorkflowEngine` so aliases like `jira` or `confluence` resolve to the live connector ids/metadata.
   - Update workflow templates only if the alias should point to a different connector id; otherwise keep the alias stable.
4. **Enable UI flows**
   - Expose credential onboarding in the Marketplace page (connect buttons / modal) and hide the simulation callouts once credentials are confirmed.
   - Use feature flags to control rollout between sandbox and production tenants.
5. **Verify & document**
   - Run unit/integration tests (`npm run connectors:check`, `npx vitest ...`) and a smoke workflow execution.
   - Update change logs, Marketplace messaging, and Confluence pages with the Go-Live status.

## Automation Helpers

- `npm run connectors:check` – verifies required environment variables are present for each connector (see script in `scripts/check-connector-transition.mjs`). Extend the script as new systems are onboarded.
- Consider adding CI checks that run the script and the orchestrator Vitest suite on pull requests touching connector resources.

## Connector-Specific Tasks

| Connector | Secrets Required | UI Updates | Feature Flag / Toggle | Verification |
|-----------|-----------------|-----------|-----------------------|--------------|
| Microsoft 365 (`office365`) | `OFFICE365_CLIENT_ID`, `OFFICE365_CLIENT_SECRET`, `OFFICE365_TENANT_ID`, `OFFICE365_SCOPE` | Replace simulation banner with credential wizard; enable real “Test Integration” action | `FF_OFFICE365_SIMULATION` → `false` | Run profile sync + onboarding workflows, check Microsoft 365 audit logs |
| Microsoft Entra / Active Directory (`activeDirectory`) | `AD_USERNAME`, `AD_PASSWORD` / service account | Update Marketplace copy; expose credential form | `FF_ACTIVE_DIRECTORY_SIMULATION` → `false` | Execute onboarding/offboarding flows, verify AD entries |
| Google Workspace (`google-workspace`) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADMIN_EMAIL`, `GOOGLE_SCOPE` | Toggle connection CTA to live flow | `FF_GOOGLE_SIMULATION` → `false` | Run onboarding workflow, verify admin audit logs |
| Slack (`slack-enterprise`) | `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET` | Enable OAuth button and disable simulation banner | `FF_SLACK_SIMULATION` → `false` | Trigger approval workflow, inspect Slack channel message |
| Jira Cloud (`jira-cloud`) | `JIRA_BASE_URL`, `JIRA_CLIENT_EMAIL`, `JIRA_API_TOKEN` | Display credential form (API token) and hide simulation note | `FF_JIRA_SIMULATION` → `false` | Run change-management workflow, ensure ticket created in Jira |
| Confluence Cloud (`confluence-cloud`) | `CONFLUENCE_BASE_URL`, `CONFLUENCE_CLIENT_EMAIL`, `CONFLUENCE_API_TOKEN` | Update documentation panel to show live links | `FF_CONFLUENCE_SIMULATION` → `false` | Verify Confluence page creation from workflow |
| Dropbox Business (`dropbox-business`) | `DROPBOX_TEAM_TOKEN` | Swap simulation copy for real status | `FF_DROPBOX_SIMULATION` → `false` | Run compliance audit workflow, check Dropbox team activity |
| Paycom Manual (`paycom-manual`) | `PAYCOM_API_KEY`, credentials for manual login | Keep manual instructions but update to reflect live endpoints | `FF_PAYCOM_SIMULATION` → `false` | Trigger manual sync, confirm Paycom status updates |

> ℹ️ **Tip:** Add connector-specific health checks to your observability stack (e.g., scheduled workflow that validates token refresh) once production credentials are active.

## Post-Go-Live

- Remove or archive simulation Marketplace history entries so only production runs appear.
- Ensure run-history views surface real connector metadata (version, tenant) and capture errors for support.
- Schedule periodic access reviews for the new service accounts or API tokens.

Keep this checklist updated as new connectors are introduced or additional automation is added.
