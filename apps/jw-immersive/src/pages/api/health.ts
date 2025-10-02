import type { APIRoute } from 'astro';
import { loadFlags, projectClientFlags } from '../../config/flags.js';
import { logger } from '../../utils/logger.js';

const started = Date.now();

export const GET: APIRoute = async ({ locals }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
  const flags = projectClientFlags(loadFlags(env));
  const commit = env.GIT_COMMIT || env.COMMIT_SHA || 'unknown';
  // Enrichment availability detection (no secrets echoed)
  const vtEnabled = typeof env.VIRUSTOTAL_API_KEY === 'string' && env.VIRUSTOTAL_API_KEY.length > 0;
  const ocveFlag = (env.OPENCVE_ENRICH || '').toString().toLowerCase() === 'true';
  const ocveAuthBasic = env.OPENCVE_USERNAME && env.OPENCVE_PASSWORD;
  const ocveAuthToken = env.OPENCVE_API_TOKEN && !ocveAuthBasic; // token only if no basic creds
  const enrichment = {
    virustotal: vtEnabled ? 'enabled' : 'disabled',
    opencve: ocveFlag ? 'enabled' : 'disabled',
    opencve_auth: ocveFlag ? (ocveAuthBasic ? 'basic' : (ocveAuthToken ? 'token' : 'none')) : 'n/a'
  } as const;
  const body = {
    ok: true,
    uptime_ms: Date.now() - started,
    commit,
    flags,
    enrichment,
    timestamp: new Date().toISOString()
  };
  try {
    const diagnostics = await (async () => {
      const candidates = [
        '../runtime/scans/service',
        '../../../../../Project-AtlasIT/src/runtime/scans/service.ts',
      ];
      for (const candidate of candidates) {
        try {
          // eslint-disable-next-line no-await-in-loop, @typescript-eslint/ban-ts-comment
          // @ts-ignore optional path
          const { getHealthScanPerf } = await import(candidate);
          return getHealthScanPerf?.();
        } catch {
          // continue searching
        }
      }
      return undefined;
    })();
    if (diagnostics) {
      (body as any).scanPerf = diagnostics;
    }
  } catch {
    // optional diagnostics; never fail health response
  }
  logger.debug('Health check', { uptime: body.uptime_ms, commit });
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
