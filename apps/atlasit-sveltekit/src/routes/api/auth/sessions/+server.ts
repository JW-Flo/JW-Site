import type { RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '$lib/server/sessionStore';

export const GET: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const store = sessionStore(platform!.env as any);
  const sessions = await store.listForUser(locals.user.id);
  // Hide sensitive fields
  const redacted = sessions.map((s) => ({
    id: s.id,
    user_id: s.user_id,
    email: s.email,
    tenant_id: s.tenant_id,
    created_at: s.created_at,
    expires_at: s.expires_at,
    revoked_at: s.revoked_at,
    ip: s.ip,
    user_agent: s.user_agent
  }));
  return new Response(JSON.stringify({ sessions: redacted }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
