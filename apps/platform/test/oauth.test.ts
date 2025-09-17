import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { webcrypto } from 'node:crypto';
import { GET as GoogleStart } from '../src/pages/api/oauth/google/index';
import { GET as GoogleCallback } from '../src/pages/api/oauth/google/callback';
import { GET as EntraStart } from '../src/pages/api/oauth/entra/index';
import { GET as EntraCallback } from '../src/pages/api/oauth/entra/callback';

Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  configurable: true,
});

const analyticsMock = vi.fn();
let uuidCounter = 0;
const uuidMock = vi.spyOn(webcrypto, 'randomUUID').mockImplementation(() => `test-uuid-${uuidCounter++}`);
vi.mock('../src/utils/analytics-server', () => ({
  storeAnalyticsEvent: (payload: any) => {
    analyticsMock(payload);
    return Promise.resolve();
  },
}));

describe('OAuth endpoints', () => {
  beforeEach(() => {
    analyticsMock.mockClear();
    uuidCounter = 0;
  });

  afterAll(() => {
    uuidMock.mockRestore();
  });

  it('returns instructions when Google OAuth is not configured', async () => {
    const response = await GoogleStart({ locals: { runtime: { env: {} } }, request: new Request('http://localhost/api/oauth/google') } as any);
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.error).toContain('not configured');
  });

  it('creates Google OAuth URL and cookie when configured', async () => {
    const response = await GoogleStart({
      locals: { runtime: { env: { GOOGLE_OAUTH_CLIENT_ID: 'client', GOOGLE_OAUTH_REDIRECT_URL: 'https://example.com/callback' } } },
      request: new Request('http://localhost/api/oauth/google'),
    } as any);

    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('atlasit_oauth_google_state=');
    const payload = await response.json();
    expect(payload.url).toContain('accounts.google.com');
  });

  it('rejects Google callback with state mismatch', async () => {
    const response = await GoogleCallback({
      request: new Request('http://localhost/api/oauth/google/callback?code=abc&state=wrong', {
        headers: { cookie: 'atlasit_oauth_google_state=expected' },
      }),
    } as any);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('oauth=error');
    expect(response.headers.get('location')).toContain('Reference%3A%20test-uuid-0');
  });

  it('accepts Google callback with valid state and code', async () => {
    const response = await GoogleCallback({
      request: new Request('http://localhost/api/oauth/google/callback?code=abc&state=expected', {
        headers: { cookie: 'atlasit_oauth_google_state=expected' },
      }),
    } as any);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('oauth=success');
    expect(response.headers.get('set-cookie')).toContain('atlasit_oauth_google_state=deleted');
    expect(analyticsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'google_oauth_callback_success',
        details: expect.objectContaining({ correlationId: 'test-uuid-0' }),
      }),
    );
  });

  it('creates Entra OAuth URL and cookie when configured', async () => {
    const response = await EntraStart({
      locals: { runtime: { env: { M365_OAUTH_CLIENT_ID: 'client', M365_OAUTH_REDIRECT_URL: 'https://example.com/callback', M365_OAUTH_TENANT_ID: 'contoso' } } },
      request: new Request('http://localhost/api/oauth/entra'),
    } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('atlasit_oauth_m365_state=');
    const payload = await response.json();
    expect(payload.url).toContain('login.microsoftonline.com/contoso');
  });

  it('handles Entra callback success', async () => {
    const response = await EntraCallback({
      request: new Request('http://localhost/api/oauth/entra/callback?code=123&state=expected', {
        headers: { cookie: 'atlasit_oauth_m365_state=expected' },
      }),
      locals: { runtime: { env: { M365_OAUTH_TENANT_ID: 'contoso' } } },
    } as any);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('oauth=success');
    expect(analyticsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'm365_oauth_callback_success',
      details: expect.objectContaining({ correlationId: 'test-uuid-0' }),
    }),
    );
  });

  it('flags Microsoft state mismatches with references', async () => {
    const response = await EntraCallback({
      request: new Request('http://localhost/api/oauth/entra/callback?code=123&state=unexpected', {
        headers: { cookie: 'atlasit_oauth_m365_state=expected' },
      }),
      locals: { runtime: { env: {} } },
    } as any);

    expect(response.status).toBe(303);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('oauth=error');
    expect(location).toContain('Reference%3A%20test-uuid-0');
  });

  it('returns helpful message when Google code is missing', async () => {
    const response = await GoogleCallback({
      request: new Request('http://localhost/api/oauth/google/callback?state=expected', {
        headers: { cookie: 'atlasit_oauth_google_state=expected' },
      }),
    } as any);

    expect(response.status).toBe(303);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('Authorization%20code%20was%20not%20returned%20by%20Google');
  });

  it('returns friendly messaging for Microsoft error_description', async () => {
    const response = await EntraCallback({
      request: new Request(
        'http://localhost/api/oauth/entra/callback?error=interaction_required&error_description=Additional%20steps&state=expected',
        {
          headers: { cookie: 'atlasit_oauth_m365_state=expected' },
        },
      ),
      locals: { runtime: { env: { M365_OAUTH_TENANT_ID: 'contoso' } } },
    } as any);

    expect(response.status).toBe(303);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('oauth=error');
    expect(location).toContain('Reference%3A%20test-uuid-0');
    expect(decodeURIComponent(location)).toContain('requires additional interaction');
  });

  it('returns friendly messaging for Google access_denied', async () => {
    const response = await GoogleCallback({
      request: new Request('http://localhost/api/oauth/google/callback?error=access_denied&state=expected', {
        headers: { cookie: 'atlasit_oauth_google_state=expected' },
      }),
    } as any);

    expect(response.status).toBe(303);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('oauth=error');
    expect(decodeURIComponent(location)).toContain('access was denied');
  });
});
