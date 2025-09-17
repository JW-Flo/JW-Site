import type { RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '$lib/server/sessionStore';

export const POST: RequestHandler = async ({ locals, platform, params }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const sessionId = params.id;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Invalid session id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = sessionStore(platform!.env as any);
  const session = await store.getSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.user_id !== locals.user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  await store.revoke(sessionId);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
