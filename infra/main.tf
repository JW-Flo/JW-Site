// Terraform scaffold (not applied yet)
// Requires: export CLOUDFLARE_API_TOKEN & CLOUDFLARE_ACCOUNT_ID environment variables
// Then: terraform init && terraform plan

terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = ">= 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" { type = string }
variable "account_id" { type = string }

# Example KV namespace
resource "cloudflare_kv_namespace" "visits" {
  account_id = var.account_id
  title      = "jw-site-visits"
}

# Example D1 database (currently not supported directly by Terraform; placeholder)
# resource "cloudflare_d1_database" "guestbook" {
#   account_id = var.account_id
#   name       = "guestbook_demo"
# }

# Pages project (Terraform support limited; this is illustrative)
# resource "cloudflare_pages_project" "site" {
#   account_id = var.account_id
#   name       = "jw-site"
#   production_branch = "main"
# }
