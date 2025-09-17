import { describe, it, expect } from 'vitest';
import { POST as login } from '../src/routes/api/auth/login/+server';
import { POST as refresh } from '../src/routes/api/auth/refresh/+server';
import { POST as logout } from '../src/routes/api/auth/logout/+server';
import { GET as protectedPing } from '../src/routes/api/protected/ping/+server';

function getSetCookie(headers: Headers): string[] {
  const raw = headers.get('set-cookie');
  if (!raw) return [];
  return raw.split(/,(?=[^;]+=)/g).map((s) => s.trim());
}

describe('Session cookies and protected API', () => {
  it('unauthorized ping returns 401', async () => {
    const res = await protectedPing({ locals: {} } as any);
    expect(res.status).toBe(401);
  });

  it('login sets access and refresh cookies', async () => {
    const env = { JWT_SECRET: 'jwt' };
    const req = new Request('https://atlasit.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@atlasit.pro', password: 'password' }),
    });
  const res = await login({ request: req, platform: { env } } as any);
    expect(res.status).toBe(200);
    const cookies = getSetCookie(res.headers);
  expect(cookies.some((c) => c.startsWith('atlasit_session='))).toBe(true);
  expect(cookies.some((c) => c.startsWith('atlasit_refresh='))).toBe(true);
  });

  it('refresh reads refresh cookie and sets new access cookie', async () => {
    const env = { JWT_SECRET: 'jwt' };
    const loginReq = new Request('https://atlasit.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@atlasit.pro', password: 'password' }),
    });
    const loginRes = await login({ request: loginReq, platform: { env } } as any);
    const cookies = getSetCookie(loginRes.headers);
    const refreshCookie = cookies.find((c) => c.startsWith('atlasit_refresh='))!;
    const sessionCookie = cookies.find((c) => c.startsWith('atlasit_session='))!;

    const refreshReq = new Request('https://atlasit.app/api/auth/refresh', {
      method: 'POST',
      headers: { cookie: `${sessionCookie}; ${refreshCookie}` },
    });
    const refreshRes = await refresh({ request: refreshReq, platform: { env } } as any);
    expect(refreshRes.status).toBe(200);
    const body = await refreshRes.json();
    expect(body.token).toBeTruthy();
    const set = getSetCookie(refreshRes.headers);
    expect(set.some((c) => c.startsWith('atlasit_refresh='))).toBe(true);
  });

  it('logout clears cookies', async () => {
    const res = await logout({ request: new Request('https://atlasit.app/api/auth/logout') } as any);
    const set = getSetCookie(res.headers);
    expect(set.some((c) => c.startsWith('atlasit_session=;'))).toBe(true);
    expect(set.some((c) => c.startsWith('atlasit_refresh=;'))).toBe(true);
  });
});
