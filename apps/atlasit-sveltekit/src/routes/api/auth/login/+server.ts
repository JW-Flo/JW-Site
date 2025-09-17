import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createJWT } from '@atlasit/edge-utils';
import { sessionStore } from '$lib/server/sessionStore';
import { rateLimiter } from '$lib/server/rateLimit';
import type { RequestHandler } from './$types';

const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LoginResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    tenantId: z.string(),
  }),
});

export const POST: RequestHandler = async ({ request, platform }) => {
  try {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const limiter = rateLimiter(platform?.env);
    if (!(await limiter.check(`login:${ip}`))) {
      return json({ error: 'Too Many Requests' }, { status: 429 });
    }
    const body = await request.json();
    const { email, password } = LoginRequestSchema.parse(body);

    // Stub: In production, query D1 database for user
    if (email !== 'admin@atlasit.pro' || password !== 'password') {
      return json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = {
      id: 'user-1',
      email,
      tenantId: 'tenant-1',
    };
    // Create server-side session and refresh token
    const store = sessionStore(platform!.env as any);
    const { id: sessionId, refreshToken } = await store.createSession(user, {
      ip: request.headers.get('cf-connecting-ip') || undefined,
      ua: request.headers.get('user-agent') || undefined,
    });

    // Optional short-lived signed access token for API clients (still supported)
    const token = await createJWT({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }, platform?.env?.JWT_SECRET || 'default-secret');

  const response = LoginResponseSchema.parse({ token, refreshToken, user });

  const siteUrl = platform?.env?.SITE_URL as string | undefined;
  const domain = siteUrl ? new URL(siteUrl).host : undefined;
  const domainAttr = domain ? `; Domain=${domain}` : '';
  const sessionCookie = `atlasit_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${domainAttr}`;
  const refreshCookie = `atlasit_refresh=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${domainAttr}`;

    return json(response, {
      headers: [
        ['Set-Cookie', sessionCookie],
        ['Set-Cookie', refreshCookie],
        ['Cache-Control', 'no-store, max-age=0'],
        ['Pragma', 'no-cache'],
      ],
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
