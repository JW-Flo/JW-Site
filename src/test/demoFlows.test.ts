import { describe, it, expect, beforeEach } from 'vitest';
import { POST as onboardingPost } from '../pages/api/onboarding/index';
import { GET as demoDataGet, POST as demoDataPost } from '../pages/api/demo/data';
import { POST as demoResetPost } from '../pages/api/demo/reset';
import { resetIamAutomationDemoData } from '../../atlasit/ui/api/iam-automation';

type KvValue = { value: string };

class InMemoryKV {
  private store = new Map<string, KvValue>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key)?.value ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, { value });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string }) {
    const prefix = options?.prefix ?? '';
    const keys = Array.from(this.store.keys())
      .filter((key) => key.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys };
  }
}

describe('Demo data flows', () => {
  beforeEach(() => {
    resetIamAutomationDemoData();
  });

  function createEnv() {
    const KV = new InMemoryKV();
    return { KV };
  }

  it('exposes demo data for dashboard consumption', async () => {
    const response = await demoDataGet({} as any);
    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.data.users.length).toBeGreaterThanOrEqual(5);
    expect(payload.data.metrics.activeUsers).toBeGreaterThan(0);
    expect(Array.isArray(payload.data.requests)).toBe(true);
  });

  it('creates onboarding config for a selected persona and stores it in KV', async () => {
    const env = createEnv();
    const request = new Request('https://example.com/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'northwind-energy',
        name: 'Northwind Energy',
        industry: 'finance',
        demoUserId: 'demo-usr-007',
      }),
    });

    const response = await onboardingPost({ request, locals: { runtime: { env } } } as any);
    expect(response.status).toBe(201);
    const json = await response.json();

    expect(json.demoUser?.id).toBe('demo-usr-007');
    const stored = await env.KV.get('onboarding:northwind-energy');
    expect(stored).not.toBeNull();
  });

  it('rejects onboarding submissions with missing fields', async () => {
    const env = createEnv();
    const request = new Request('https://example.com/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Acme',
        industry: 'finance',
      }),
    });

    const response = await onboardingPost({ request, locals: { runtime: { env } } } as any);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('ONB-001');
  });

  it('rejects onboarding submissions with invalid persona IDs', async () => {
    const env = createEnv();
    const request = new Request('https://example.com/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'persona-test',
        name: 'Persona Test',
        industry: 'technology',
        demoUserId: 'does-not-exist',
      }),
    });

    const response = await onboardingPost({ request, locals: { runtime: { env } } } as any);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('ONB-003');
  });

  it('resets demo data including onboarding KV entries', async () => {
    const env = createEnv();
    await env.KV.put('onboarding:temp', JSON.stringify({ foo: 'bar' }));

    const response = await demoResetPost({ request: new Request('https://example.com/api/demo/reset', { method: 'POST' }), locals: { runtime: { env } } } as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);

    const cleared = await env.KV.get('onboarding:temp');
    expect(cleared).toBeNull();
  });

  it('rejects write attempts to demo data endpoint', async () => {
    const response = await demoDataPost({ request: new Request('https://example.com/api/demo/data', { method: 'POST' }) } as any);
    expect(response.status).toBe(405);
  });
});
