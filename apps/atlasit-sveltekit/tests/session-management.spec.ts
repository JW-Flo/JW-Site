import { describe, it, expect } from 'vitest';
import { POST as login } from '../src/routes/api/auth/login/+server';
import { GET as listSessions } from '../src/routes/api/auth/sessions/+server';
import { POST as revokeAll } from '../src/routes/api/auth/sessions/revoke-all/+server';
import { POST as revokeOne } from '../src/routes/api/auth/sessions/[id]/revoke/+server';

function getSetCookie(headers: Headers): string[] {
  const raw = headers.get('set-cookie');
  if (!raw) return [];
  return raw.split(/,(?=[^;]+=)/g).map((s) => s.trim());
}

function getCookie(cookies: string[], name: string): string | undefined {
  const c = cookies.find((x) => x.startsWith(name + '='));
  return c;
}

describe('Session management endpoints', () => {
  it('lists sessions for current user', async () => {
    const env = { JWT_SECRET: 'jwt' };
    const req = new Request('https://atlasit.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@atlasit.pro', password: 'password' }),
    });
    const res = await login({ request: req, platform: { env } } as any);
    expect(res.status).toBe(200);

    const listRes = await listSessions({ locals: { user: { id: 'user-1' } }, platform: { env } } as any);
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    expect(Array.isArray(body.sessions)).toBe(true);
    expect(body.sessions.length).toBeGreaterThan(0);
  });

  it('revokes a single session and revoke-all works', async () => {
    const env = { JWT_SECRET: 'jwt' };
    // Login twice to create two sessions
    const doLogin = async () => {
      const req = new Request('https://atlasit.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@atlasit.pro', password: 'password' }),
      });
      const res = await login({ request: req, platform: { env } } as any);
      const cookies = getSetCookie(res.headers);
      const sessionCookie = getCookie(cookies, 'atlasit_session');
      expect(sessionCookie).toBeTruthy();
      return { cookies, sessionId: sessionCookie!.split(';')[0].split('=')[1] };
    };
  const a = await doLogin();
  await doLogin();

    const oneRes = await revokeOne({ locals: { user: { id: 'user-1' } }, platform: { env }, params: { id: a.sessionId } } as any);
    expect(oneRes.status).toBe(200);

    const listAfterOne = await listSessions({ locals: { user: { id: 'user-1' } }, platform: { env } } as any);
    const bodyOne = await listAfterOne.json();
    const matchA = bodyOne.sessions.find((s: any) => s.id === a.sessionId);
    expect(matchA).toBeTruthy();
    expect(matchA.revoked_at).toBeTruthy();

    const allRes = await revokeAll({ locals: { user: { id: 'user-1' } }, platform: { env } } as any);
    expect(allRes.status).toBe(200);

    const listAfterAll = await listSessions({ locals: { user: { id: 'user-1' } }, platform: { env } } as any);
    const bodyAll = await listAfterAll.json();
    expect(bodyAll.sessions.length).toBeGreaterThan(0);
    expect(bodyAll.sessions.every((s: any) => !!s.revoked_at)).toBe(true);
  });
});
