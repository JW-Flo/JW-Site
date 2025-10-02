import type { APIRoute } from 'astro';

const FALLBACK = {
  total: { count: 0, avg: null, p50: null, p95: null, lastMs: null, successRate: null },
  modules: {} as Record<string, unknown>,
};

export const GET: APIRoute = async () => {
  const candidates = [
    '../runtime/scans/metrics',
    '../runtime/scans/metrics.ts',
    '../runtime/scans/service',
  '../../../Project-AtlasIT/src/runtime/scans/metrics.ts',
  '../../../Project-AtlasIT/src/runtime/scans/metrics',
  '../../../Project-AtlasIT/src/runtime/scans/service.ts',
  '../../../Project-AtlasIT/src/runtime/scans/service',
  ];
  let metrics: typeof FALLBACK = FALLBACK;
  for (const candidate of candidates) {
    try {
  // eslint-disable-next-line no-await-in-loop
  const mod: unknown = await import(candidate);
  if (
    mod &&
    typeof mod === 'object' &&
    ('getScanTimings' in mod || 'getScanMetrics' in mod)
  ) {
    const fn =
      typeof (mod as any).getScanTimings === 'function'
        ? (mod as any).getScanTimings
        : typeof (mod as any).getScanMetrics === 'function'
        ? (mod as any).getScanMetrics
        : undefined;
    if (typeof fn === 'function') {
      const data = fn();
      if (data && data.total && data.modules) {
        metrics = { total: data.total, modules: data.modules };
        break;
      }
    }
  }
    } catch {
      /* continue */
    }
  }

  return new Response(JSON.stringify(metrics), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
