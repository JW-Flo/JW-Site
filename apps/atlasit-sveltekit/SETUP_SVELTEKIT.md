# SvelteKit Workspace Setup (AtlasIT)

This document captures the exact steps to scaffold and configure the dedicated SvelteKit workspace for AtlasIT.

## Workspace

Location: `apps/atlasit-sveltekit`

Scaffolded with:

- `npx sv create . --template minimal --types ts --no-add-ons --no-install`
- SvelteKit v2, Svelte v5, Vite v7

## Cloudflare Adapter

- Switched to `@sveltejs/adapter-cloudflare` with Pages output.
- Config: `svelte.config.js`

```js
adapter: adapter({ pages: true, runtime: 'edge' })
```

## Cloudflare Pages / Workers

- Local `wrangler.toml` lives in `apps/atlasit-sveltekit/`.
- Staging domain (.app): `SITE_URL=https://atlasit.app`
- Production domain (.pro): set via `[env.production]` → `SITE_URL=https://atlasit.pro`

Deploy (Pages):

```sh
npm run build --workspace apps/atlasit-sveltekit
npm run deploy:pages --workspace apps/atlasit-sveltekit
```

## Environment Bindings

When creating resources, add bindings here and in the dashboard:

- D1: `D1_DB`
- KV: `SESSION` (session cache), `SCANNER_META` (optional)
- R2: `R2_BUCKET` (media)

Example snippets are commented in `wrangler.toml`.

## Verify runtime bindings

With the dev server running, confirm each platform binding resolves correctly via `/api/bindings`:

```bash
npm run dev:atlasit
curl -s http://127.0.0.1:5173/api/bindings | jq
```

The response lists boolean flags (`SITE_URL`, `D1_DB_BOUND`, `SESSION_BOUND`, `R2_BUCKET_BOUND`). Values should read `true` when the corresponding binding is available in your environment. Troubleshoot missing bindings before continuing.

## Marketplace integrations preview

The Marketplace page now surfaces first-class "Connect" affordances for Google Workspace and Microsoft 365 / Entra ID. With the dev server running, open <http://127.0.0.1:5173/marketplace> and confirm:

- The Google tile links to `/api/oauth/google`.
- The Microsoft tile links to `/api/oauth/entra`.
- Additional integrations returned by `/api/iam-automation?type=integrations` render beneath the featured tiles.

These buttons are consumed by Playwright coverage, so keep the hrefs stable.

## Account sessions UI

Authenticated users can review and revoke active sessions at `/account/sessions`. After logging in with the demo flow:

```bash
curl -X POST http://127.0.0.1:5173/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@atlasit.app","password":"atlas-demo"}' \
  -c cookies.txt

curl http://127.0.0.1:5173/account/sessions -b cookies.txt
```

The page lists each session, enables per-session revoke, and provides a "Revoke all other sessions" action. Both flows call the JSON APIs (`/api/auth/sessions/:id/revoke`, `/api/auth/sessions/revoke-all`) and present success or error banners based on the response.

## IAM automation storyline data

The `/api/iam-automation` endpoint now serves a seeded Joiner/Mover/Leaver storyline driven by a Paycom → Okta integration. Verify the dataset locally:

```bash
curl -s http://127.0.0.1:5173/api/iam-automation?type=workflows | jq '.[0]'
```

- Joiner workflows highlight that Paycom lacks XaaS / SCIM, forcing a manual step while the remaining systems are fully automated.
- Mover/leaver personas show downstream automations across Salesforce, Gainsight, and Google Workspace.
- The Marketplace, Dashboard, Orchestrator, and Onboarding pages render automation levels, manual notes, and system capabilities from this dataset.

## TypeScript Bindings

Bindings are typed in `src/app.d.ts` under `App.Platform.env`:

```typescript
interface Platform {
  env: {
    D1_DB: D1Database;
    SESSION: KVNamespace;
    R2_BUCKET: R2Bucket;
    OAUTH_GOOGLE_CLIENT_ID: string;
    OAUTH_GOOGLE_CLIENT_SECRET: string;
    OAUTH_MICROSOFT_CLIENT_ID: string;
    OAUTH_MICROSOFT_CLIENT_SECRET: string;
    OAUTH_ENTRA_CLIENT_ID: string;
    OAUTH_ENTRA_CLIENT_SECRET: string;
    SITE_URL: string;
  };
}
```

Access via `event.platform.env` in server-side code (endpoints, hooks).

Example usage in `/api/health`:

```typescript
const siteUrl = event.platform?.env?.SITE_URL || 'https://atlasit.app';
```

## Scripts

- `build`: `svelte-kit build`
- `preview`: `svelte-kit preview`
- `deploy:pages`: `wrangler pages deploy .svelte-kit/cloudflare --project-name atlasit-sveltekit`

Run from monorepo root with workspaces:

```sh
npm run build --workspace apps/atlasit-sveltekit
npm run preview --workspace apps/atlasit-sveltekit
```

## Next

- Port shared utilities and endpoints to `src/routes`.
- Add Playwright and Vitest setup mirroring existing repository conventions.
- Wire .env variables via `import.meta.env` and SvelteKit `$env/static/private`/`$env/static/public`.

## Automation (optional but recommended)

From repo root:

```sh
npm i -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npm pkg set scripts.prepare="husky"
npx husky init
npx husky add .husky/pre-commit "npm run -s lint-staged"
npx husky add .husky/pre-push "npm run -s typecheck && npm run -s test"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

Add to `package.json`:

```jsonc
{
 "lint-staged": {
  "*.{ts,tsx,js,jsx,svelte}": [
   "npm run -w apps/atlasit-sveltekit lint --if-present",
   "npm run -w apps/atlasit-sveltekit format --if-present"
  ]
 },
 "commitlint": { "extends": ["@commitlint/config-conventional"] }
}
```

## Testing

Unit tests with Vitest:

```sh
npm run test
```

E2E tests with Playwright (when added):

```sh
npx playwright test
```

## MCP Settings (.well-known)

To expose MCP settings for tooling, place the file under `static/.well-known/mcp-settings.json` so it is served at `/.well-known/mcp-settings.json`.

Example content:

```json
{
  "mcpServers": {
    "Tavily Expert": {
      "serverUrl": "https://tavily.api.tadata.com/mcp/tavily/dog-behold-osmosis-sdi249"
    }
  }
}
```

Confirm availability during dev:

```bash
npm run dev:atlasit
curl -s http://localhost:5173/.well-known/mcp-settings.json | jq
```

## Cloudflare Bindings (recap)

Bindings must be declared in `wrangler.toml` and typed in `src/app.d.ts`.

- D1: `D1_DB`
- KV: `SESSION`
- R2: `R2_BUCKET`
- Secrets: `OAUTH_*`, `SITE_URL`

Example (commented) blocks are in `wrangler.toml`; align binding names with `app.d.ts`.
