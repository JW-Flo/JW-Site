// Build/version identifier used to help invalidate older deployments.
// At build time, an environment variable BUILD_ID or COMMIT_SHA can override.
export const BUILD_ID = process.env.COMMIT_SHA || process.env.BUILD_ID || 'dev';
