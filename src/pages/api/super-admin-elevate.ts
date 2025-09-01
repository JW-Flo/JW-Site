import type { APIRoute } from 'astro';
import { ScanStore } from '../../utils/scanStore.js';
import { applyRateLimit, rateLimitHeaders } from '../../utils/applyRateLimit.js';
import { logger } from '../../utils/logger.js';

// Elevate current session to super-admin if correct key supplied
// Sets role flag in in-memory session only (ephemeral until session expires)
// Request body: { key: string }
// Response: { elevated: boolean }
export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
  // Rate limit elevation attempts (e.g., 5 per 10 minutes per IP)
  const rl = await applyRateLimit({ env, key: `elevate:${clientAddress || 'unknown'}`, max: 5, windowMs: 10*60*1000 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ elevated: false, error: 'rate-limited' }), { status: 429, headers: { 'Content-Type': 'application/json', ...rateLimitHeaders(rl) } });
  }
  const SUPER_ADMIN_KEY = env.SUPER_ADMIN_KEY || '';
  if (!SUPER_ADMIN_KEY) {
    logger.error('Elevation attempted without configured key');
    return new Response(JSON.stringify({ error: 'Super admin not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const store = new ScanStore(env);
  const { record, cookieHeader } = await store.getOrCreateSession(request);
  let body: any = {};
  try { body = await request.json(); } catch {}
  if (!body.key || body.key !== SUPER_ADMIN_KEY) {
    logger.warn('Invalid super admin elevation key');
    return new Response(JSON.stringify({ elevated: false, error: 'Invalid key' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  store.elevateToSuperAdmin(record);
  logger.info('Super admin elevated', { sid: record.id });
  // Always refresh role cookie on successful elevation
  const exp = Date.now() + 1000*60*60; // 1h
  const base = `sa.${exp}`;
  // Reuse signing from ScanStore by constructing signature via dynamic import? Simpler: duplicate minimal HMAC helper here.
  async function hmacSign(secret: string, value: string): Promise<string> {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
    return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  const roleSecret = env.ROLE_SIGNING_KEY || env.SESSION_SIGNING_KEY || 'dev-signing-key';
  const rsig = await hmacSign(roleSecret, base);
  const roleCookie = `escan_role=${encodeURIComponent(base+'.'+rsig)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60*60}`;
  const setCookies = [cookieHeader, roleCookie].filter(Boolean).join(', ');
  return new Response(JSON.stringify({ elevated: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': setCookies } });
};
