# Cloudflare Containment Scripts

This folder contains helper scripts to inventory and disable public surface area on atlasit.pro.

## Scripts

- `inventory.sh`
  - Lists Pages projects and routes, Workers routes, DNS A/AAAA/CNAME records, and Access apps for the account/zone.
- `disable.sh`
  - Clears Pages routes for projects, deletes Workers routes, deletes applicable DNS records, and denies Access apps by setting `policies: []`.

## Requirements

- macOS or Linux shell (bash)
- `jq` installed
- Environment variables:
  - `CF_API_TOKEN` (token with required scopes for Pages, Workers, DNS, Access)
  - `CF_ACCOUNT_ID` (Cloudflare account ID)
  - `CF_ZONE_ID_PRO` (Zone ID for atlasit.pro)

## Usage

Dry-run inventory:

```bash
export CF_API_TOKEN=***
export CF_ACCOUNT_ID=***
export CF_ZONE_ID_PRO=***

./inventory.sh
```

Disable exposure (idempotent, destructive):

```bash
./disable.sh
```

> Important: `disable.sh` makes changes. Ensure you have backups and approvals. Run `inventory.sh` first and save the JSON output for audit.

## Notes

- These scripts are designed to be idempotent and operate only on the specified zone/account.
- DNS deletion is scoped to A/AAAA/CNAME records whose names contain `atlasit.pro`.
- Access application "deny all" is implemented by updating each app to have an empty `policies` array.
- A GitHub Actions workflow exists to run these in CI with provided secrets. See `.github/workflows/containment.yml`.
