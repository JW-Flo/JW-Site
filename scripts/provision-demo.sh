#!/usr/bin/env bash
set -euo pipefail

echo "== Cloudflare Provisioning for Demo Features (KV, D1, R2) =="

CFG=wrangler.toml
WRANGLER="npx -y wrangler"
if ! $WRANGLER --version >/dev/null 2>&1; then
  echo "Wrangler CLI not available; ensure dev dependency installed." >&2
  exit 1
fi

if ! $WRANGLER whoami >/dev/null 2>&1; then
  echo "Not authenticated. Launching login..." >&2
  $WRANGLER login
fi

# KV namespace (create then list to fetch id if binding not present)
if ! grep -q 'kv_namespaces' "$CFG"; then
  echo "Creating KV namespace VISITS...";
  $WRANGLER kv namespace create VISITS --config $CFG || true
  cat <<EOT >> $CFG

[[kv_namespaces]]
binding = "VISITS"
# Replace with actual id (copy from: npx wrangler kv namespace list)
id = "VISITS_NAMESPACE_ID"
EOT
  echo "Added KV binding placeholder; update VISITS_NAMESPACE_ID manually.";
fi

# D1
if ! grep -q 'd1_databases' "$CFG"; then
  echo "Creating D1 database guestbook_demo...";
  $WRANGLER d1 create guestbook_demo --config $CFG || true
  cat <<EOT >> $CFG

[[d1_databases]]
binding = "DB"
# Replace with actual database name & id (use: npx wrangler d1 list)
database_name = "GUESTBOOK_DB_NAME"
database_id = "GUESTBOOK_DB_ID"
EOT
  echo "Added D1 binding placeholders; update name/id then run init SQL manually.";
fi

# R2
if ! grep -q 'r2_buckets' "$CFG"; then
  echo "Creating R2 bucket MEDIA...";
  $WRANGLER r2 bucket create MEDIA --config $CFG || true
  cat <<EOT >> $CFG

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "MEDIA"
EOT
  echo "Added R2 bucket binding.";
fi

echo "== Provisioning complete =="

echo "Manual steps:"
echo "1. In Pages project settings add TURNSTILE_SECRET_KEY env var and PUBLIC_TURNSTILE_SITE_KEY build var."
echo "2. (Optional) Add custom domain andreysergeevich.me as alias if desired."
echo "3. Deploy: npm run build && npm run deploy:preview"
echo "4. Promote: npm run deploy"
