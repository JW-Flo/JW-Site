# MCP Server Security

Add this to your .env file for local security:

MCP_BEARER_TOKEN=atlasit-demo-token

# Usage

- All /search and /fetch requests must include:
  Authorization: Bearer atlasit-demo-token

# Example curl

curl -s -X POST <https://mcp.atlasit.pro/search> \
  -H 'Authorization: Bearer atlasit-demo-token' \
  -H 'Content-Type: application/json' \
  -d '{"query":"atlas"}' | jq

curl -s -X POST <https://mcp.atlasit.pro/fetch> \
  -H 'Authorization: Bearer atlasit-demo-token' \
  -H 'Content-Type: application/json' \
  -d '{"id":"doc-1"}' | jq

# Rate Limiting

- Each IP is limited to 30 requests/minute for /search and /fetch.

# Next Steps

- For production, rotate MCP_BEARER_TOKEN and store securely.
- Enable Cloudflare Access for additional protection.
