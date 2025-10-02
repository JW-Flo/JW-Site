import type { APIRoute } from 'astro';
import { loadFlags, projectClientFlags } from '../../config/flags.js';
import { logger } from '../../utils/logger.js';

const started = Date.now();

export const GET: APIRoute = async ({ locals }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
  const flags = projectClientFlags(loadFlags(env));
  const commit = env.GIT_COMMIT || env.COMMIT_SHA || 'unknown';
  const body = {
    ok: true,
    uptime_ms: Date.now() - started,
    commit,
    flags,
    timestamp: new Date().toISOString()
  };
  try {
    // Lazy import to avoid bundling issues if runtime directory not present in this workspace.
    // If registry not initialized, getSnapshot() will build an empty one.
    // Wrapped in try so health never fails.
    const maybe = await (async () => {
      const candidates = [
        '../../runtime/registry/registry',
        '../../../../Project-AtlasIT/src/runtime/registry/registry.ts',
      ];
      const importPromises = candidates.map(async (candidate) => {
        try {
          // @ts-ignore optional path
          const { getSnapshot } = await import(candidate);
          const snap = getSnapshot();
          return {
            version: snap.version,
            counts: snap.counts,
            lastBuildTs: snap.createdAt,
            features: {
              version: snap.version,
              countsByKind: snap.counts,
            },
          };
        } catch {
          return null;
        }
      });
      const results = await Promise.allSettled(importPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }
      return null;
    })();
    if (maybe) {
      (body as any).dynamicRegistry = maybe; // append-only
    }
    const perf = await (async () => {
      const candidates = [
        '../../runtime/scans/service',
        '../../../../Project-AtlasIT/src/runtime/scans/service.ts',
      ];
      for (const candidate of candidates) {
        try {
          // eslint-disable-next-line no-await-in-loop, @typescript-eslint/ban-ts-comment
          // @ts-ignore optional path
          const { getHealthScanPerf } = await import(candidate);
          return getHealthScanPerf?.();
        } catch {
          // try next candidate
        }
      }
      return undefined;
    })();
    if (perf) {
      (body as any).scanPerf = perf;
    }
  } catch { /* swallow */ }
  logger.debug('Health check', { uptime: body.uptime_ms, commit });
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
