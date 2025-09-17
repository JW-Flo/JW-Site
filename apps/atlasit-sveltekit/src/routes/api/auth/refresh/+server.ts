import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createJWT, parseCookie } from '@atlasit/edge-utils';
import { sessionStore } from '$lib/server/sessionStore';
import { rateLimiter } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    // Allow body or cookie-based refresh
    let refreshToken: string | null = null;
    try {
      const body = await request.json();
      const parsed = RefreshRequestSchema.safeParse(body);
      if (parsed.success) refreshToken = parsed.data.refreshToken;
    } catch {}
    if (!refreshToken) refreshToken = parseCookie(request.headers.get('cookie'), 'atlasit_refresh');
    const sessionId = parseCookie(request.headers.get('cookie'), 'atlasit_session');
    if (!refreshToken || !sessionId) {
      return json({ error: 'No session or refresh token' }, { status: 400 });
    }

    const store = sessionStore(platform!.env as any);
    const limiter = rateLimiter(platform?.env, { windowSec: 60, max: 60 });
    if (!(await limiter.check(`refresh:${sessionId}:${ip}`))) {
      return json({ error: 'Too Many Requests' }, { status: 429 });
    }
    const rotated = await store.rotateRefresh(sessionId, refreshToken);
    if (!rotated) {
      return json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Mint short-lived access token for API users
    // We need the user identity; fetch from session
    const session = await store.getSession(sessionId);
    if (!session) return json({ error: 'Session not found' }, { status: 401 });
    const newToken = await createJWT({
      sub: session.user_id,
      email: session.email,
      tenantId: session.tenant_id,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }, platform?.env?.JWT_SECRET || 'default-secret');

    const siteUrl = platform?.env?.SITE_URL as string | undefined;
    const domain = siteUrl ? new URL(siteUrl).host : undefined;
    const domainAttr = domain ? `; Domain=${domain}` : '';
    const setHeaders: Array<[string, string]> = [
      ['Set-Cookie', `atlasit_refresh=${rotated.refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${domainAttr}`],
      ['Cache-Control', 'no-store, max-age=0'],
      ['Pragma', 'no-cache'],
    ];
    return json({ token: newToken }, { headers: setHeaders });
  } catch (error) {
    console.error('Refresh error:', error);
    return json({ error: 'Invalid refresh token' }, { status: 400 });
  }
};
