#!/usr/bin/env bash
set -euo pipefail

echo "== Cloudflare Provisioning for andreysergeevich.me Demo =="

if ! command -v wrangler >/dev/null 2>&1; then
  echo "Wrangler CLI not found. Install locally (npm i -D wrangler) or globally first." >&2
  exit 1
fi

if ! wrangler whoami >/dev/null 2>&1; then
  echo "Not authenticated. Launching login..." >&2
  wrangler login
fi

CFG=wrangler-andrey.toml

# Create KV namespace
if ! grep -q 'VISITS' "$CFG"; then
  echo "Creating KV namespace VISITS...";
  KV_JSON=$(wrangler kv:namespace create VISITS --config $CFG --output json | tail -n1)
  KV_ID=$(echo "$KV_JSON" | sed -E 's/.*"id":"([^"]+)".*/\1/')
  echo "KV namespace id: $KV_ID"
  echo "Appending KV binding to $CFG";
  printf '\n[[kv_namespaces]]\nbinding = "VISITS"\nid = "%s"\n' "$KV_ID" >> $CFG
fi

# Create D1 database
if ! grep -q 'd1_databases' "$CFG"; then
  echo "Creating D1 database andrey_guestbook...";
  D1_JSON=$(wrangler d1 create andrey_guestbook --config $CFG --output json | tail -n1)
  D1_NAME=$(echo "$D1_JSON" | sed -E 's/.*"name":"([^"]+)".*/\1/')
  D1_ID=$(echo "$D1_JSON" | sed -E 's/.*"uuid":"([^"]+)".*/\1/')
  echo "D1 database id: $D1_ID"
  printf '\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "%s"\ndatabase_id = "%s"\n' "$D1_NAME" "$D1_ID" >> $CFG
  echo "Initializing guestbook table...";
  wrangler d1 execute "$D1_NAME" --config $CFG --command "CREATE TABLE IF NOT EXISTS entries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, message TEXT, created_at INTEGER);"
fi

# Create R2 bucket
if ! grep -q 'r2_buckets' "$CFG"; then
  echo "Creating R2 bucket MEDIA...";
  wrangler r2 bucket create MEDIA --config $CFG || true
  printf '\n[[r2_buckets]]\nbinding = "MEDIA"\nbucket_name = "MEDIA"\n' >> $CFG
fi

echo "== Completed provisioning steps =="

echo "Next manual steps:"
echo "1. Create Turnstile site & secret in dashboard."
echo "2. Add TURNSTILE_SECRET_KEY env var in Pages project settings (do not commit)."
echo "3. Replace placeholder site key in src-andrey/pages/guestbook.astro."
echo "4. Run: npm run build:andrey && npm run deploy:andrey:preview"
echo "5. When satisfied: npm run deploy:andrey"
