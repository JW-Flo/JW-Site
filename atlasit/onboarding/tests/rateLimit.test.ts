import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { rateLimit } from '../src/middleware/rateLimit';

type KvStore = Map<string, string>;

function createKv(initial?: Record<string, string>) {
  const store: KvStore = new Map(Object.entries(initial ?? {}));

  return {
    store,
    namespace: {
      async get(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      async put(key: string, value: string) {
        store.set(key, value);
      },
    } as unknown as KVNamespace,
  };
}

function createApp(envOverrides: Partial<Record<string, any>>) {
  const app = new Hono();
  app.use('*', rateLimit());
  app.get('/test', (c) => c.json({ ok: true }));

  const env = {
    RATE_LIMIT_MAX_REQUESTS: '2',
    RATE_LIMIT_WINDOW_SECONDS: '60',
    ...envOverrides,
  };

  return { app, env };
}

describe('rateLimit middleware', () => {
  it('allows requests under the limit and sets headers', async () => {
    const { store, namespace } = createKv();
    const { app, env } = createApp({ RATE_LIMIT: namespace });

    const request = new Request('https://example.com/test', {
      headers: { 'X-Forwarded-For': '1.1.1.1' },
    });

    const response = await app.fetch(request, env);
    expect(response.status).toBe(200);
    expect(store.size).toBe(1);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('2');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('1');
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    const { namespace } = createKv();
    const { app, env } = createApp({ RATE_LIMIT: namespace, RATE_LIMIT_MAX_REQUESTS: '1' });

    const request = new Request('https://example.com/test');

    const firstResponse = await app.fetch(request, env);
    expect(firstResponse.status).toBe(200);

    const secondResponse = await app.fetch(request, env);
    expect(secondResponse.status).toBe(429);
    expect(Number(secondResponse.headers.get('Retry-After'))).toBeGreaterThanOrEqual(0);
    expect(secondResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('recovers gracefully from malformed KV state', async () => {
    const { namespace } = createKv({ 'ratelimit:1.1.1.1': 'not-json' });
    const { app, env } = createApp({ RATE_LIMIT: namespace });

    const request = new Request('https://example.com/test', {
      headers: { 'X-Forwarded-For': '1.1.1.1' },
    });

    const response = await app.fetch(request, env);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('1');
  });

  it('skips throttling when RATE_LIMIT binding is missing', async () => {
    const { app, env } = createApp({ RATE_LIMIT: undefined });
    const request = new Request('https://example.com/test');

    const response = await app.fetch(request, env);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
  });
});
