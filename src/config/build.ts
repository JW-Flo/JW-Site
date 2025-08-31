// Build/version identifier used to help invalidate older deployments.
// At build time, an environment variable BUILD_ID or COMMIT_SHA can override.
export const BUILD_ID = (import.meta as any).env?.COMMIT_SHA || (import.meta as any).env?.BUILD_ID || 'dev';
