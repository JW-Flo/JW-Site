# Infrastructure as Code (Placeholder)

This directory will house Terraform configuration for provisioning Cloudflare resources:

Planned resources:

- cloudflare_pages_project (jw-site)
- cloudflare_kv_namespace (visits / rate limiting)
- cloudflare_d1_database (guestbook)
- (Optional) secrets (refer to dashboard for Turnstile keys)

Notes:

- R2 removed (cost optimization)
- For now, manual creation via wrangler / dashboard; Terraform stub kept for future automation.
