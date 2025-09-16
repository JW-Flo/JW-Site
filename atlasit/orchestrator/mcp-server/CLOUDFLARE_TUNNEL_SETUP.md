# Cloudflare Tunnel Configuration for MCP Server

## Tunnel Name

`mcp-tunnel`

## DNS Routing

Created CNAME pointing `mcp.atlasit.pro` to the tunnel (ID: `c463b1fd-b6a3-4ab4-b2fe-50d5415f03cb`).

## Ingress Configuration

Add ingress rules in `~/.cloudflared/config.yml` to route HTTP requests to the local MCP server (port 3000):

```yaml
tunnel: c463b1fd-b6a3-4ab4-b2fe-50d5415f03cb
credentials-file: /Users/jw/.cloudflared/c463b1fd-b6a3-4ab4-b2fe-50d5415f03cb.json

ingress:
  - hostname: mcp.atlasit.pro
    service: http://localhost:3000
  - service: http_status:404
```

Restart the tunnel after saving:

```bash
pkill -f 'cloudflared tunnel run mcp-tunnel' || true
cloudflared tunnel run mcp-tunnel
```

## Verification Steps

```bash
curl -s https://mcp.atlasit.pro/health | jq
curl -s -X POST https://mcp.atlasit.pro/search -H 'Content-Type: application/json' -d '{"query":"atlas"}' | jq
curl -s -X POST https://mcp.atlasit.pro/fetch -H 'Content-Type: application/json' -d '{"id":"doc-1"}' | jq
```

If responses contain expected JSON content arrays, the tunnel is working.

## Connector Configuration

Use the following in ChatGPT Connectors / Deep Research:

```json
{
  "type": "mcp",
  "server_label": "atlasit",
  "server_url": "https://mcp.atlasit.pro/sse/",
  "allowed_tools": ["search", "fetch"],
  "require_approval": "never"
}
```

## Security Hardening (Next)

- Add Cloudflare Access (email restriction) for `mcp.atlasit.pro`.
- Add simple bearer token middleware on `/search` & `/fetch`.
- Enable rate limiting (e.g., `express-rate-limit`).
- Log request IDs & redact sensitive headers.

## Notes

If you need to rotate the tunnel, delete the JSON credentials file and recreate the tunnel with the same name; update the ID in this doc.
