# Cloudflare Resource Provisioning (AtlasIT SvelteKit)

This guide sets up KV, D1, and R2 for the SvelteKit app.

## 1) Create KV (SESSION)

```bash
# Preview (dev/testing)
wrangler kv:namespace create SESSION

# Production
wrangler kv:namespace create SESSION --env=production
```

Copy the namespace IDs into `apps/atlasit-sveltekit/wrangler.toml` under `[[kv_namespaces]]` and `[[env.production.kv_namespaces]]`.

## 2) Create D1 (D1_DB)

```bash
# Preview/Dev
wrangler d1 create atlasit_preview

# Production
wrangler d1 create atlasit_prod
```

Update the returned database IDs in `wrangler.toml` for `[[d1_databases]]` and `[[env.production.d1_databases]]`.

## 3) Apply Sessions Migration

```bash
cd apps/atlasit-sveltekit
wrangler d1 migrations apply D1_DB --local # local
wrangler d1 migrations apply D1_DB         # remote (preview/prod)
```

## 4) R2 (optional for media)

Create an R2 bucket and set binding names to `R2_BUCKET` in `wrangler.toml` (already scaffolded).

## 5) Verify bindings locally

Run dev or preview and check:

```bash
curl -s http://localhost:4173/api/bindings | jq
```

Expect booleans for SITE_URL, SESSION_BOUND, D1_DB_BOUND, R2_BUCKET_BOUND.
