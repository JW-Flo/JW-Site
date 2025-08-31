import type { ScanContext, ScanBundle } from './scanTypes.js';
import { runCoreScans } from './coreScans.js';
import { computeScores } from './scoring.js';

export async function runScan(ctx: ScanContext): Promise<ScanBundle> {
  const start = performance.now();
  const findings = [] as any[];
  findings.push(...await runCoreScans(ctx));
  if (ctx.mode !== 'business') {
  const { runEngineerScans } = await import('./engineerScans.js');
    findings.push(...await runEngineerScans(ctx));
  }
  if (ctx.mode === 'super-admin') {
  const { runAdminScans } = await import('./adminScans.js');
    findings.push(...await runAdminScans(ctx));
  }
  const scores = computeScores(findings);
  return {
    findings,
    meta: { durationMs: performance.now() - start, scanKeys: ctx.selected },
    scores
  };
}
