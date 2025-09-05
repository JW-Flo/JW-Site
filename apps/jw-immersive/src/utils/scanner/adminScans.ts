import type { ScanContext, Finding } from './scanTypes.js';

interface ApiScanResponse { findings?: Finding[] }

async function callApi(url: string, type: string, superAdminMode: boolean, adminKey?: string): Promise<ApiScanResponse> {
  const res = await fetch('/api/enhanced-security-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type, superAdminMode, adminKey })
  });
  if (!res.ok) throw new Error(`Scan ${type} failed: ${res.status}`);
  return res.json();
}

export async function runAdminScans(ctx: ScanContext): Promise<Finding[]> {
  if (ctx.mode !== 'super-admin') return [];
  const tasks: Promise<Finding[]>[] = [];
  const push = (key: string) => tasks.push(callApi(ctx.url, key, true, ctx.adminKey).then(r => r.findings || []));
  if (ctx.selected.includes('content-analysis')) push('content-analysis');
  if (ctx.selected.includes('privacy-compliance')) push('privacy-compliance');
  if (ctx.selected.includes('performance-security')) push('performance-security');
  // Removed heavier scans intentionally
  const results = await Promise.all(tasks);
  return results.flat();
}
