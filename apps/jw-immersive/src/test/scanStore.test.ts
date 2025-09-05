import { describe, it, expect, beforeEach } from 'vitest';
import { ScanStore, sanitizeUrl, hashUA } from '../utils/scanStore.js';

class MockKV {
  data = new Map<string,string>();
  async get(key: string): Promise<string|null> { return this.data.get(key) || null; }
  async put(key: string, value: string): Promise<void> { this.data.set(key, value); }
  async delete(key: string): Promise<void> { this.data.delete(key); }
  getWithMetadata: any; list: any;
}

describe('ScanStore consent & region gating', () => {
  let env: any; let kv: MockKV; let store: ScanStore;
  beforeEach(() => { kv = new MockKV(); env = { SESSION_SIGNING_KEY: 'test-sign', SCANNER_META: kv }; store = new ScanStore(env); });

  function mkReq(cookie?: string) { return new Request('https://example.com/api', { headers: cookie ? { Cookie: cookie } : {} }); }

  it('issues session cookie on first request', async () => {
    const { record, cookieHeader } = await store.getOrCreateSession(mkReq());
    expect(record.id).toBeTruthy();
    expect(cookieHeader).toMatch(/escan_s=/);
  });

  it('reuses existing session with valid signature', async () => {
    const first = await store.getOrCreateSession(mkReq());
    const second = await store.getOrCreateSession(mkReq(first.cookieHeader));
    expect(second.record.id).toEqual(first.record.id);
    expect(second.cookieHeader).toBeUndefined();
  });

  it('does NOT persist without consent (EU-like scenario)', async () => {
    const base = await store.getOrCreateSession(mkReq());
    await store.addScan(base.record, { url: 'https://site.eu', timestamp: Date.now(), mode: 'business', findings: 1, critical: 0 }, { analytics: false, research: false });
    expect(kv.data.size).toBe(0);
  });

  it('does not persist without consent even if region allows (current policy)', async () => {
    const base = await store.getOrCreateSession(mkReq());
    await store.addScan(base.record, { url: 'https://us.com', timestamp: Date.now(), mode: 'business', findings: 2, critical: 0 }, { analytics: false, research: false });
    expect(kv.data.size).toBe(0);
  });

  it('persists with analytics consent for EU', async () => {
    const consentReq = mkReq('cc_prefs=' + encodeURIComponent('a:1|r:0'));
    const sess = await store.getOrCreateSession(consentReq);
    await store.addScan(sess.record, { url: 'https://eu.com', timestamp: Date.now(), mode: 'business', findings: 3, critical: 1 }, { analytics: true, research: false });
    expect(kv.data.size).toBeGreaterThan(0);
  });

  it('adds research fields only with research consent', async () => {
    const rReq = mkReq('cc_prefs=' + encodeURIComponent('a:1|r:1'));
    const sess = await store.getOrCreateSession(rReq);
    await store.addScan(sess.record, { url: 'https://r.com/path', timestamp: Date.now(), mode: 'engineer', findings: 5, critical: 1, score: 90, country: 'US', uaHash: hashUA('UA') }, { analytics: true, research: true });
    const storedVals = Array.from(kv.data.values()).map(v=>JSON.parse(v));
    const researchPacket = storedVals.find(p=>p.m==='engineer');
    expect(researchPacket.ua).toBeDefined();
    expect(researchPacket.co).toBe('US');
  });

  it('sanitizeUrl truncates long path', () => {
    const s = sanitizeUrl('https://example.com/' + 'a'.repeat(300));
    expect(s.length).toBeLessThan(120);
  });
});
