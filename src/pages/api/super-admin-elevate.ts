import type { APIRoute } from 'astro';
import { ScanStore } from '../../utils/scanStore.js';

// Elevate current session to super-admin if correct key supplied
// Sets role flag in in-memory session only (ephemeral until session expires)
// Request body: { key: string }
// Response: { elevated: boolean }
export const POST: APIRoute = async ({ request, locals }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
  const SUPER_ADMIN_KEY = env.SUPER_ADMIN_KEY || '';
  if (!SUPER_ADMIN_KEY) {
    return new Response(JSON.stringify({ error: 'Super admin not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const store = new ScanStore(env);
  const { record, cookieHeader } = await store.getOrCreateSession(request);
  let body: any = {};
  try { body = await request.json(); } catch {}
  if (!body.key || body.key !== SUPER_ADMIN_KEY) {
    return new Response(JSON.stringify({ elevated: false, error: 'Invalid key' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  store.elevateToSuperAdmin(record);
  return new Response(JSON.stringify({ elevated: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { 'Set-Cookie': cookieHeader } : {}) } });
};
