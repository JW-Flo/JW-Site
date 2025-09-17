import type { RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '$lib/server/sessionStore';

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const store = sessionStore(platform!.env as any);
  await store.revokeAllForUser(locals.user.id);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
