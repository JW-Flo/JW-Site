import type { APIRoute } from 'astro';
import { registerRoute } from '../../../../../Project-AtlasIT/src/runtime/routes/registerRoute.ts';

registerRoute({ id: 'diagnostics-scan-timings-app', method: 'GET', path: '/api/_diagnostics' });

export const GET: APIRoute = async () => {
  const diagnostics = await (async () => {
    const candidates = [
      '../runtime/scans/service',
      '../../../../../Project-AtlasIT/src/runtime/scans/service.ts',
    ];
    for (const candidate of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop, @typescript-eslint/ban-ts-comment
        // @ts-ignore optional path
        const { getScanTimings } = await import(candidate);
        return getScanTimings?.();
      } catch {
        // continue searching
      }
    }
    return { total: { count: 0, avg: null, p50: null, p95: null, lastMs: null }, modules: {} };
  })();

  return new Response(JSON.stringify({ diagnostics: { scanTimings: diagnostics } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
