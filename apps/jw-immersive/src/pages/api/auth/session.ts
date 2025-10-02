import type { APIRoute } from 'astro';
import { createSessionStore } from '@atlasit/auth';

// GET /api/auth/session – returns minimal session metadata if present
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
    const store = createSessionStore({ SESSION: (env as any).SESSION, D1_DB: (env as any).D1_DB });
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/(?:^|;\s*)escan_s=([^;]+)/);
    let sessionId: string | null = null;
    if (match) {
      const raw = decodeURIComponent(match[1]);
      sessionId = raw.split('.')[0];
    }
    if (!sessionId) {
      return new Response(JSON.stringify({ ok: false, session: null }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const session = await store.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, session: null }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const body = {
      ok: true,
      session: {
        id: session.id,
        user: session.user ? { id: session.user.id, email: session.user.email } : null,
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt,
        revoked: !!session.revokedAt
      }
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};
