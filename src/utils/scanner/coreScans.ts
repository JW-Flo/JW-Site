import type { ScanContext, Finding } from './scanTypes.js';

interface ApiScanResponse {
  findings?: Finding[];
  businessMetrics?: any; // not used in lite core aggregation yet
}

async function callApi(url: string, type: string, superAdminMode: boolean, adminKey?: string): Promise<ApiScanResponse> {
  const res = await fetch('/api/enhanced-security-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type, superAdminMode, adminKey })
  });
  if (!res.ok) throw new Error(`Scan ${type} failed: ${res.status}`);
  return res.json();
}

export async function runCoreScans(ctx: ScanContext): Promise<Finding[]> {
  const tasks: Promise<Finding[]>[] = [];
  const push = (key: string) => tasks.push(
    callApi(ctx.url, key, ctx.mode === 'super-admin', ctx.adminKey).then(r => r.findings || [])
  );
  if (ctx.selected.includes('headers')) push('headers');
  if (ctx.selected.includes('ssl')) push('ssl');
  if (ctx.selected.includes('info')) push('info');
  if (ctx.selected.includes('common')) push('common');
  const results = await Promise.all(tasks);
  return results.flat();
}
