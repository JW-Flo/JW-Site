import { describe, it, expect } from 'vitest';
import { POST } from '../pages/api/enhanced-security-scan.ts';

function makeContext(body: any, env: Record<string,string> = {}, ip = '127.0.0.1') {
  const request = new Request('https://example.test/api/enhanced-security-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { request, clientAddress: ip, locals: { runtime: { env } } } as any;
}

describe('enhanced-security-scan full aggregate', () => {
  it('returns combined findings across categories', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'full' });
    const res = await POST(ctx);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data.findings)).toBe(true);
    expect(data.findings.length).toBeGreaterThan(0);
    const categories = new Set(data.findings.map((f: any) => f.category));
  const expectedSome = ['Security Headers','SSL/TLS','Performance Security','Tech Stack','Subdomain Enumeration','CVE Exposure','Third-Party Scripts','Threat Intelligence'];
    const present = expectedSome.filter(c => categories.has(c));
    expect(present.length).toBeGreaterThanOrEqual(3);
  }, 20000);
});
