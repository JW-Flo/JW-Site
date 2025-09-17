terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = ">= 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.api_token
}

resource "cloudflare_ruleset" "pro_block_app" {
  name        = "Block app path"
  description = "Block /app on atlasit.pro"
  kind        = "zone"
  phase       = "http_request_firewall_custom"
  zone_id     = var.zone_id_pro

  rules = [{
    action      = "block"
    description = "Block /app path"
    enabled     = true
    expression  = "starts_with(http.request.uri.path, \"/app\")"
  }]
}

# Access apps for dev/stg
resource "cloudflare_zero_trust_access_application" "dev" {
  account_id       = var.account_id
  name             = "dev.atlasit.app"
  domain           = "dev.atlasit.app"
  type             = "self_hosted"
  session_duration = "8h"

  # Attach per-app policies (v5: precedence is defined here, not on a standalone policy)
  policies = [
    {
      name       = "Dev Allowlist"
      decision   = "allow"
      precedence = 1
      include    = [for e in var.dev_emails : { email = { email = e } }]
    },
    {
      name       = "Dev Deny All"
      decision   = "deny"
      precedence = 10000
      include    = [{ everyone = {} }]
    }
  ]
}

resource "cloudflare_zero_trust_access_application" "stg" {
  account_id       = var.account_id
  name             = "stg.atlasit.app"
  domain           = "stg.atlasit.app"
  type             = "self_hosted"
  session_duration = "8h"

  # Attach per-app policies (v5)
  policies = [
    {
      name       = "Staging Allowlist"
      decision   = "allow"
      precedence = 1
      include    = [for e in var.team_emails : { email = { email = e } }]
    },
    {
      name       = "Staging Deny All"
      decision   = "deny"
      precedence = 10000
      include    = [{ everyone = {} }]
    }
  ]
}
## Standalone Access policy resources are not used in v5 for per-application precedence.
## Policies are defined within each application via the 'policies' attribute above.
