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

export async function runEngineerScans(ctx: ScanContext): Promise<Finding[]> {
  if (ctx.mode === 'business') return [];
  const tasks: Promise<Finding[]>[] = [];
  const push = (key: string) => tasks.push(callApi(ctx.url, key, ctx.mode === 'super-admin', ctx.adminKey).then(r => r.findings || []));
  if (ctx.selected.includes('advanced-headers')) push('advanced-headers');
  if (ctx.selected.includes('waf')) push('waf');
  if (ctx.selected.includes('tech-stack')) push('tech-stack');
  const results = await Promise.all(tasks);
  return results.flat();
}
