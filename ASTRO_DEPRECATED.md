# Astro (jw-immersive) Application Deprecated

The former marketing/landing Astro app `jw-immersive` is no longer deployed.

## Replacement

The functionality and surface now lives in the `atlasit-console` Cloudflare Worker (see parent monorepo `Project-AtlasIT`), which serves:

- `/console*`
- `/access-requests*`
- `/incidents*`
- `/api/config*`
- `/api/mock/*`

## Deployment Change

The GitHub Actions workflow `.github/workflows/deploy-pages.yml` has been disabled (job guarded by `if: false`). No further Pages builds will run automatically.

## Secrets

- `WRANGLER_API_TOKEN` (with Workers + Pages scopes) and `CF_ACCOUNT_ID` remain required for worker deployments.
- `CF_API_TOKEN` is optional unless future Pages projects are reintroduced.

## Future Cleanup

Once confirmed no consumers rely on legacy URLs served by the Pages project, you may:

1. Delete the Cloudflare Pages project `jw-site`.
2. Remove the `apps/jw-immersive` directory.
3. Delete the deprecated workflow file entirely.

## Rollback

To restore the old deployment temporarily, remove the `if: false` gate in the workflow and re-enable build steps.

---
Last updated: (auto)
