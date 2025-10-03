# Astro (jw-immersive) Application Fully Removed

The former marketing/landing Astro app `jw-immersive` has been removed from the repository (directory deleted) and its Cloudflare Pages workflow disabled and slated for deletion.

## Replacement

All user-facing dashboard and mock API functionality lives in the `atlasit-console` Cloudflare Worker (primary platform repo). Active routes:

- `/console*`
- `/access-requests*`
- `/incidents*`
- `/api/config*`
- `/api/mock/*`

## Deployment Change

The Pages workflow was disabled, and the source directory removed. Future deploys will not rebuild the Astro site. Remove the deprecated workflow file when comfortable.

## Secrets

- `WRANGLER_API_TOKEN` (Workers + Pages scopes) and `CF_ACCOUNT_ID` support worker deployments.
- `CF_API_TOKEN` no longer required unless a new Pages project is introduced.

## Cleanup Status

- [x] Workflow disabled
- [x] Directory deleted
- [ ] Pages project deletion (manual dashboard step)
- [ ] Remove workflow file (optional final step)

## Next Manual Step

In Cloudflare Dashboard, delete the Pages project `jw-site` to prevent accidental reactivation.

---
Last updated: (auto)
