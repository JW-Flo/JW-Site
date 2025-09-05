import { describe, it, expect, beforeEach } from 'vitest';

// Minimal mocks for Astro API route handlers
import { GET as GuestbookGET, POST as GuestbookPOST } from '../pages/api/guestbook.ts';

// Helper to build a mock environment
function buildEnv(overrides: any = {}) {
  // Simple in-memory KV mock
  const kvStore: Record<string, string> = {};
  const KV = {
    get: async (key: string) => kvStore[key] ?? null,
    put: async (key: string, value: string) => { kvStore[key] = value; },
    delete: async (key: string) => { delete kvStore[key]; }
  };

  // Simple D1 mock for guestbook entries
  const entries: any[] = [];
  const DB = {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        run: async () => {
          if (/INSERT/i.test(sql)) {
            entries.push({ id: entries.length + 1, name: params[0], message: params[1], created_at: params[2] });
            return { success: true };
          }
          return { success: true };
        }
      }),
      all: async () => ({ results: entries.slice().reverse().slice(0,25) })
    })
  };

  return {
    runtime: {
      env: {
        ANALYTICS: KV,
        DB,
        TURNSTILE_SECRET_KEY: 'test-secret',
        ...overrides
      }
    }
  };
}

// Minimal Turnstile verification bypass by stubbing fetch
const realFetch = global.fetch;
beforeEach(() => {
  // Replace global fetch with a stub for Turnstile verification
  (global as any).fetch = async (url: string) => {
    if (url.includes('turnstile')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return realFetch(url as any);
  };
});

describe('Guestbook API', () => {
  it('rejects posting without qualifying game score', async () => {
    const locals: any = buildEnv();

    const request = new Request('http://localhost/api/guestbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'PlayerOne', message: 'Hello world', turnstileToken: 'tok' })
    });

    const response = await GuestbookPOST({ request, locals, clientAddress: '127.0.0.1' } as any);
    expect(response.status).toBe(403);
  const data = await response.json() as any;
    expect(data.error).toBe('Game score requirement not met');
  });

  it('accepts posting when player bestScore meets requirement', async () => {
    const locals: any = buildEnv();

    // Seed KV with a valid player stats object (bestScore >= 100)
    const playerKey = 'player-PlayerTwo';
    await locals.runtime.env.ANALYTICS.put(playerKey, JSON.stringify({
      totalGames: 3,
      totalScore: 250,
      bestScore: 150,
      gamesPlayed: { 'asteroids': 3 },
      lastPlayed: new Date().toISOString()
    }));

    const request = new Request('http://localhost/api/guestbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'PlayerTwo', message: 'Great site!', turnstileToken: 'tok' })
    });

    const response = await GuestbookPOST({ request, locals, clientAddress: '127.0.0.1' } as any);
    expect(response.status).toBe(200);
  const data = await response.json() as any;
    expect(data.ok).toBe(true);
    expect(data.message).toContain('Entry added');
  });

  it('GET returns entries after successful POST', async () => {
    const locals: any = buildEnv();
    const playerKey = 'player-PlayerThree';
    await locals.runtime.env.ANALYTICS.put(playerKey, JSON.stringify({
      totalGames: 1,
      totalScore: 120,
      bestScore: 120,
      gamesPlayed: { 'asteroids': 1 },
      lastPlayed: new Date().toISOString()
    }));

    const postReq = new Request('http://localhost/api/guestbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'PlayerThree', message: 'Entry test', turnstileToken: 'tok' })
    });
    const postResp = await GuestbookPOST({ request: postReq, locals, clientAddress: '127.0.0.1' } as any);
    expect(postResp.status).toBe(200);

    const getResp = await GuestbookGET({ locals, clientAddress: '127.0.0.1' } as any);
    expect(getResp.status).toBe(200);
  const list = await getResp.json() as any;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].message).toBe('Entry test');
  });
});
