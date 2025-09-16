import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { auth } from '../src/middleware/auth';

function createApp(apiKeys?: string) {
  const app = new Hono();
  app.use('*', auth());
  app.get('/secure', (c) => c.json({ actor: c.get('actor') ?? null }));

  const env = apiKeys ? { API_ALLOWED_KEYS: apiKeys } : {};
  return { app, env };
}

describe('auth middleware', () => {
  it('skips enforcement when no API keys are configured', async () => {
    const { app, env } = createApp();

    const response = await app.fetch(new Request('https://example.com/secure'), env);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.actor).toBeNull();
  });

  it('authenticates requests with a valid API key and records actor', async () => {
    const { app, env } = createApp('admin=abc123');

    const response = await app.fetch(new Request('https://example.com/secure', {
      headers: { 'x-api-key': 'abc123' },
    }), env);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.actor).toBe('admin');
  });

  it('rejects requests without a key when authentication is required', async () => {
    const { app, env } = createApp('admin=abc123');

    const response = await app.fetch(new Request('https://example.com/secure'), env);
    expect(response.status).toBe(401);

    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer realm="onboarding-api", error="invalid_token"');
    expect(response.headers.get('x-request-id')).toBeTruthy();

    const body = await response.json();
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });

  it('rejects requests with invalid API keys', async () => {
    const { app, env } = createApp('admin=abc123');

    const response = await app.fetch(new Request('https://example.com/secure', {
      headers: { 'x-api-key': 'wrong' },
    }), env);

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBeNull();
    expect(response.headers.get('x-request-id')).toBeTruthy();

    const body = await response.json();
    expect(body.error.code).toBe('AUTH_INVALID');
  });
});
