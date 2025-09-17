#!/usr/bin/env bash
set -euo pipefail

: "${CF_API_TOKEN:?set CF_API_TOKEN}"
: "${CF_ACCOUNT_ID:?set CF_ACCOUNT_ID}"
: "${CF_ZONE_ID_PRO:?set CF_ZONE_ID_PRO}"

jq_install() { command -v jq >/dev/null 2>&1 || { echo "jq is required"; exit 1; }; }
jq_install

echo "Disabling Pages routes for atlasit.pro..."
projects=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects")
echo "$projects" | jq -r '.result[] | @base64' | while read -r row; do
  _jq() { echo "$row" | base64 --decode | jq -r "$1"; }
  name=$(_jq '.name')
  routes=$(_jq '.deployment_configs.production.routes // [] | length')
  if [ "$routes" != "0" ]; then
    echo "Clearing routes for $name"
    curl -s -X PATCH -H "Authorization: Bearer $CF_API_TOKEN" -H 'Content-Type: application/json' \
      "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects/$name" \
      --data '{"deployment_configs":{"production":{"routes":[]}}}' | jq '.success, .errors'
  fi
done

echo "Deleting Workers routes on atlasit.pro..."
current=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_PRO/workers/routes")
echo "$current" | jq -r '.result[] | .id' | while read -r id; do
  [ -z "$id" ] && continue
  curl -s -X DELETE -H "Authorization: Bearer $CF_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_PRO/workers/routes/$id" | jq '.success, .errors'
done

echo "Deleting app-exposing DNS records..."
dns=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_PRO/dns_records?per_page=500")
echo "$dns" | jq -r '.result[] | select((.name|contains("atlasit.pro")) and (.type=="A" or .type=="AAAA" or .type=="CNAME")) | .id' | while read -r id; do
  [ -z "$id" ] && continue
  curl -s -X DELETE -H "Authorization: Bearer $CF_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID_PRO/dns_records/$id" | jq '.success, .errors'
done

echo "Denying Access apps on atlasit.pro..."
apps=$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/access/apps")
echo "$apps" | jq -r '.result[] | select(.domain | contains("atlasit.pro")) | @base64' | while read -r row; do
  _jq() { echo "$row" | base64 --decode | jq -r "$1"; }
  id=$(_jq '.id')
  # Patch to zero policies (deny all fallback)
  curl -s -X PUT -H "Authorization: Bearer $CF_API_TOKEN" -H 'Content-Type: application/json' \
    "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/access/apps/$id" \
    --data '{"policies":[{"decision":"deny","include":[{"everyone":{}}]}]}' | jq '.success, .errors'
done
