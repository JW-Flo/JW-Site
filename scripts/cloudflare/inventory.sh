#!/usr/bin/env bash
set -euo pipefail

: "${CF_API_TOKEN:?set CF_API_TOKEN}"
: "${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}"
: "${CF_ZONE_ID_PRO:?set CF_ZONE_ID_PRO}"

echo "# Pages projects"
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" | jq '.result[] | {name, domains: (.deployment_configs.production.routes // [])}'

echo "# Worker routes on atlasit.pro"
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_PRO/workers/routes" | jq '.result[] | {pattern, script}'

echo "# DNS records"
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_PRO/dns_records?per_page=500" | jq '.result[] | {type, name, content, proxied}'

echo "# Access apps bound to atlasit.pro"
curl -s -H "Authorization: Bearer $CF_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/access/apps" | jq '.result[] | select(.domain | contains("atlasit.pro")) | {name, domain, session_duration}'
