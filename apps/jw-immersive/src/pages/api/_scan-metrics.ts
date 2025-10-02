import type { APIRoute } from 'astro';

const FALLBACK = {
  total: { count: 0, avg: null, p50: null, p95: null, lastMs: null, successRate: null },
  modules: {} as Record<string, unknown>,
};

export const GET: APIRoute = async () => {
  const candidates = [
    '../runtime/scans/metrics',
    '../runtime/scans/metrics.ts',
    '../../../../../Project-AtlasIT/src/runtime/scans/metrics',
    '../../../../../Project-AtlasIT/src/runtime/scans/metrics.ts',
    '../runtime/scans/service',
    '../../../../../Project-AtlasIT/src/runtime/scans/service',
    '../../../../../Project-AtlasIT/src/runtime/scans/service.ts',
  ];
  let metrics: typeof FALLBACK = FALLBACK;
  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop, @typescript-eslint/ban-ts-comment
      // @ts-ignore optional path resolution
      const mod = await import(candidate);
      const fn = (mod.getScanMetrics || mod.getScanTimings) as (() => any) | undefined;
      if (typeof fn === 'function') {
        const data = fn();
        if (data && data.total) {
          metrics = { total: data.total, modules: data.modules };
          break;
        }
      }
    } catch {
      // try next
    }
  }

  return new Response(JSON.stringify(metrics), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
