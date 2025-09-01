import { describe, it, expect } from 'vitest';
import { POST } from '../pages/api/enhanced-security-scan.ts';

// Minimal mock of Astro context pieces used by POST
function makeContext(body: any, ip = '127.0.0.1') {
  const jsonBody = JSON.stringify(body);
  const request = new Request('https://example.test/api/enhanced-security-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonBody
  });
  return { request, clientAddress: ip, locals: { runtime: { env: {} } } } as any;
}

describe('enhanced-security-scan functional smoke', () => {
  it('performs ssl scan (http no https case)', async () => {
    const ctx = makeContext({ url: 'http://neverssl.com', type: 'ssl' });
    const res = await POST(ctx);
    expect(res.status).toBe(200);
  const data: any = await res.json();
    expect(Array.isArray(data.findings)).toBe(true);
    const titles = data.findings.map((f: any) => f.title);
    expect(titles.some((t: string) => /HTTPS|HTTP/i.test(t))).toBe(true);
  }, 15000);

  it('performs headers scan basic', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'headers' });
    const res = await POST(ctx);
    expect(res.status).toBe(200);
  const data: any = await res.json();
    expect(data.findings).toBeDefined();
  }, 15000);

  it('rejects invalid type', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'nope' });
    const res = await POST(ctx);
    expect(res.status).toBe(400);
  const data: any = await res.json();
    expect(data.code).toBe('INVALID_SCAN_TYPE');
  });
});
