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
  logger.debug('Health check', { uptime: body.uptime_ms, commit });
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
