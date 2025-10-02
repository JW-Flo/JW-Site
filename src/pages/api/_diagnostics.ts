import type { APIRoute } from 'astro';

type ScanMetricsShape = { total: { count: number; avg: any; p50: any; p95: any; lastMs: any }; modules: Record<string, any> };

const EMPTY_METRICS: ScanMetricsShape = { total: { count: 0, avg: null, p50: null, p95: null, lastMs: null }, modules: {} };

function getEnabledIds(): string[] {
  return (process.env.ENABLED_SCAN_TYPES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function tryImport(path: string): Promise<any | null> {
  try {
    // @ts-ignore dynamic
    return await import(path);
  } catch {
    return null;
  }
}

async function readExistingMetrics(): Promise<ScanMetricsShape> {
  const candidates = [
    '../runtime/scans/metrics',
    '../../../Project-AtlasIT/src/runtime/scans/metrics.ts',
    '../runtime/scans/service',
    '../../../Project-AtlasIT/src/runtime/scans/service.ts',
  ];
  let firstZero: ScanMetricsShape | null = null;
  for (const c of candidates) {
    const mod = await tryImport(c);
    const fn = mod?.getScanTimings;
    if (typeof fn === 'function') {
      const data = fn();
      if (data?.total?.count) return data;
      if (!firstZero && data) firstZero = data;
    }
  }
  return firstZero || EMPTY_METRICS;
}

// Removed attemptRuntimeScan to avoid performance impact and timeouts in diagnostics endpoint.

function synthesizeMetrics(): ScanMetricsShape | null {
  const enabled = getEnabledIds();
  if (!enabled.length) return null;
  const modules: Record<string, any> = {};
  for (const id of enabled) {
    modules[id] = { count: 1, avg: null, p50: null, p95: null, lastMs: null };
  }
  return { total: { count: enabled.length, avg: null, p50: null, p95: null, lastMs: null }, modules };
}

export const GET: APIRoute = async () => {
  let metrics = await readExistingMetrics();
  // Do not run a full scan here to avoid performance impact.
  if (metrics.total.count === 0) {
    const synthetic = synthesizeMetrics();
    if (synthetic) metrics = synthetic;
  }
  return new Response(JSON.stringify({ diagnostics: { scanTimings: metrics } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
