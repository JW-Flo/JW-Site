import { describe, it, expect } from 'vitest';
import { GET as geoGET } from '../pages/api/geo.ts';
import { POST as consentPOST } from '../pages/api/consent.ts';
import { GET as consentStatsGET } from '../pages/api/admin/consent-stats.ts';

function buildRequest(method: string, headers: Record<string,string> = {}, body?: any) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) init.body = JSON.stringify(body);
  return new Request('http://localhost/api/test', init);
}

describe('Geo & Consent APIs', () => {
  it('geo API omits hash fields when feature disabled', async () => {
    const original = process.env.FEATURE_GEO_CLASSIFICATION;
    process.env.FEATURE_GEO_CLASSIFICATION = 'false';
    const res = await geoGET({ request: buildRequest('GET') } as any);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.ip).toBeDefined();
    expect(data.featureGeo).toBe(false);
    expect(data.ipHash).toBeUndefined();
    process.env.FEATURE_GEO_CLASSIFICATION = original;
  });

  it('geo API includes hash fields when feature enabled', async () => {
    const original = process.env.FEATURE_GEO_CLASSIFICATION;
    process.env.FEATURE_GEO_CLASSIFICATION = 'true';
    process.env.GEO_HASH_KEY = 'test-secret';
    const res = await geoGET({ request: buildRequest('GET', { 'CF-Connecting-IP': '203.0.113.5' }) } as any);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.featureGeo).toBe(true);
    expect(data.ipHash).toBeDefined();
    expect(data.hashAlgo).toContain('hmac');
    process.env.FEATURE_GEO_CLASSIFICATION = original;
  });

  it('consent API disabled returns 403', async () => {
    const original = process.env.FEATURE_CONSENT_D1;
    process.env.FEATURE_CONSENT_D1 = 'false';
    const res = await consentPOST({ request: buildRequest('POST', {}, { sessionId: 'abc', essential: true, analytics: false, research: false, marketing: false, timestamp: Date.now() }) } as any);
    expect(res.status).toBe(403);
    process.env.FEATURE_CONSENT_D1 = original;
  });

  it('consent API enabled returns ok (with mock DB)', async () => {
    const original = process.env.FEATURE_CONSENT_D1;
    process.env.FEATURE_CONSENT_D1 = 'true';
    // mock DB binding
    (globalThis as any).DB = {
      prepare: () => ({
        bind: () => ({ run: runMock })
      })
    };
    async function runMock() { /* no-op */ }
    const res = await consentPOST({ request: buildRequest('POST', {}, { sessionId: 'abc', essential: true, analytics: true, research: true, marketing: false, timestamp: Date.now(), ipHash: 'abcd', hashAlgo: 'hmac-sha256:16' }) } as any);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.ok).toBe(true);
    process.env.FEATURE_CONSENT_D1 = original;
    delete (globalThis as any).DB;
  });

  it('admin stats 404 without key', async () => {
    const res = await consentStatsGET({ request: buildRequest('GET') } as any);
    expect(res.status).toBe(404);
  });

  it('admin stats returns aggregates with key and mock DB', async () => {
    process.env.CONSENT_ADMIN_KEY = 'adminkey';
    (globalThis as any).DB = {
      prepare: () => ({
        first: async () => ({ total: 3, analytics_on: 2, research_on: 1, marketing_on: 0 }),
        all: async () => ({ results: [ { session_id: 's1', ip_hash: 'abc', country: 'US', created_at: '2025-08-31T00:00:00Z', analytics: 1, research: 0, marketing: 0 } ] })
      })
    };
    const res = await consentStatsGET({ request: buildRequest('GET', { 'X-Admin-Key': 'adminkey' }) } as any);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.ok).toBe(true);
    expect(data.totals.total).toBe(3);
    delete (globalThis as any).DB;
    delete process.env.CONSENT_ADMIN_KEY;
  });
});
