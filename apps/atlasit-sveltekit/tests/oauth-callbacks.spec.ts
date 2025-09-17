import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as googleStart } from '../src/routes/api/oauth/google/+server';
import { GET as googleCallback } from '../src/routes/api/oauth/google/callback/+server';
import { GET as entraStart } from '../src/routes/api/oauth/entra/+server';
import { GET as entraCallback } from '../src/routes/api/oauth/entra/callback/+server';

function makeEvent(url: string, cookie?: string, env: Record<string, any> = {}) {
  return {
    request: new Request(url, { headers: cookie ? { cookie } as any : undefined }),
    platform: { env } as any,
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  } as any;
}

describe('OAuth Callbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('google happy path', async () => {
    // Start to get state
    const startEnv = { OAUTH_GOOGLE_CLIENT_ID: 'cid', SITE_URL: 'https://atlasit.app' };
    const startRes = await googleStart({ platform: { env: startEnv } } as any);
    const startData = await startRes.json();

    // Mock token and profile endpoints
    const tokenSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'at' }), { status: 200 });
      }
      if (url.includes('www.googleapis.com/oauth2/v3/userinfo')) {
        return new Response(JSON.stringify({ sub: 'u1', email: 'a@b.com', hd: 'acme.com' }), { status: 200 });
      }
      return fetch(input, init);
    });

    const env = {
      OAUTH_GOOGLE_CLIENT_ID: 'cid',
      OAUTH_GOOGLE_CLIENT_SECRET: 'secret',
      SITE_URL: 'https://atlasit.app',
      JWT_SECRET: 'jwt',
    };

    const cbUrl = `https://atlasit.app/api/oauth/google/callback?code=X&state=${startData.state}`;
    const cbEvent = makeEvent(cbUrl, `atlasit_oauth_google_state=${startData.state}`, env);

    const cbRes = await googleCallback(cbEvent);
    expect(cbRes.status).toBe(200);
    const cbData = await cbRes.json();
    expect(cbData.token).toBeTruthy();
    expect(cbData.refreshToken).toBeTruthy();
    expect(cbData.user.email).toBe('a@b.com');

    tokenSpy.mockRestore();
  });

  it('entra happy path', async () => {
    const startEnv = { OAUTH_ENTRA_CLIENT_ID: 'cid', SITE_URL: 'https://atlasit.app' };
    const startRes = await entraStart({ platform: { env: startEnv } } as any);
    const startData = await startRes.json();

    const tokenSpy = vi.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/oauth2/v2.0/token')) {
        return new Response(JSON.stringify({ access_token: 'at' }), { status: 200 });
      }
      if (url.includes('graph.microsoft.com/v1.0/me')) {
        return new Response(JSON.stringify({ id: 'e1', userPrincipalName: 'x@y.com', tenantId: 't1' }), { status: 200 });
      }
      return fetch(input, init);
    });

    const env = {
      OAUTH_ENTRA_CLIENT_ID: 'cid',
      OAUTH_ENTRA_CLIENT_SECRET: 'secret',
      SITE_URL: 'https://atlasit.app',
      JWT_SECRET: 'jwt',
    };

    const cbUrl = `https://atlasit.app/api/oauth/entra/callback?code=X&state=${startData.state}`;
    const cbEvent = makeEvent(cbUrl, `atlasit_oauth_m365_state=${startData.state}`, env);

    const cbRes = await entraCallback(cbEvent);
    expect(cbRes.status).toBe(200);
    const cbData = await cbRes.json();
    expect(cbData.user.email).toBe('x@y.com');
    expect(cbData.token).toBeTruthy();

    tokenSpy.mockRestore();
  });

  it('errors on missing state/code', async () => {
    const env = {
      OAUTH_GOOGLE_CLIENT_ID: 'cid',
      OAUTH_GOOGLE_CLIENT_SECRET: 'secret',
      SITE_URL: 'https://atlasit.app',
      JWT_SECRET: 'jwt',
    };
    const badEvent = makeEvent('https://atlasit.app/api/oauth/google/callback?code=X', '', env);
    const res = await googleCallback(badEvent);
    expect(res.status).toBe(400);
  });

  it('errors on invalid state', async () => {
    const env = {
      OAUTH_ENTRA_CLIENT_ID: 'cid',
      OAUTH_ENTRA_CLIENT_SECRET: 'secret',
      SITE_URL: 'https://atlasit.app',
      JWT_SECRET: 'jwt',
    };
    const badEvent = makeEvent('https://atlasit.app/api/oauth/entra/callback?code=X&state=abc', 'atlasit_oauth_m365_state=zzz', env);
    const res = await entraCallback(badEvent);
    expect(res.status).toBe(400);
  });
});
