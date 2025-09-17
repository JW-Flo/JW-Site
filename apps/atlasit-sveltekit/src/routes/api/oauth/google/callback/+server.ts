import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createJWT, jsonResponse, noStoreHeaders, parseCookie } from '@atlasit/edge-utils';
import { sessionStore } from '$lib/server/sessionStore';

export const GET = async (event: RequestEvent) => {
  const { request, platform } = event;
  const env = platform?.env;

  const url = (event as any).url as URL || new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');

  if (!env?.OAUTH_GOOGLE_CLIENT_ID || !env?.OAUTH_GOOGLE_CLIENT_SECRET) {
    return json(
      { error: 'Google OAuth is not configured.' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  if (!state) {
    return json({ error: 'Missing state' }, { status: 400, headers: noStoreHeaders() });
  }
  if (!code) {
    return json({ error: 'Missing code' }, { status: 400, headers: noStoreHeaders() });
  }

  const cookieHeader = request.headers.get('cookie');
  const cookieState = parseCookie(cookieHeader, 'atlasit_oauth_google_state');
  if (!cookieState || cookieState !== state) {
    return json({ error: 'Invalid state' }, { status: 400, headers: noStoreHeaders() });
  }

  const redirectUri = `${env.SITE_URL || 'https://atlasit.app'}/api/oauth/google/callback`;

  // Exchange code for access token
  const tokenRes = await event.fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.OAUTH_GOOGLE_CLIENT_ID,
      client_secret: env.OAUTH_GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text().catch(() => '');
    return json(
      { error: 'Token exchange failed', details: text?.slice(0, 200) },
      { status: 502, headers: noStoreHeaders() }
    );
  }
  const tokenJson: any = await tokenRes.json().catch(() => ({}));
  const accessToken: string | undefined = tokenJson.access_token;
  if (!accessToken) {
    return json({ error: 'No access token received' }, { status: 502, headers: noStoreHeaders() });
  }

  // Fetch user profile
  const profileRes = await event.fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    const text = await profileRes.text().catch(() => '');
    return json(
      { error: 'Failed to fetch profile', details: text?.slice(0, 200) },
      { status: 502, headers: noStoreHeaders() }
    );
  }
  const profile: any = await profileRes.json().catch(() => ({}));
  const user = {
    id: String(profile.sub || profile.id || ''),
    email: String(profile.email || ''),
    tenantId: String(profile.hd || 'google'),
  };

  // Create server-side session and return short-lived access token for compatibility
  const store = sessionStore(env as any);
  const { id: sessionId, refreshToken } = await store.createSession({ id: user.id, email: user.email, tenantId: user.tenantId });
  const now = Math.floor(Date.now() / 1000);
  const token = await createJWT({
    sub: user.id || 'unknown',
    email: user.email,
    tenantId: user.tenantId,
    type: 'access',
    exp: now + 60 * 60,
  }, env.JWT_SECRET || 'default-secret');

  const headers = {
    ...noStoreHeaders(),
    'Set-Cookie': [
      'atlasit_oauth_google_state=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Lax',
      `atlasit_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      `atlasit_refresh=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
    ].join(', '),
  } as Record<string, string>;

  return jsonResponse({ token, refreshToken, user }, 200, headers);
};
