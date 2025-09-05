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

describe('enhanced-security-scan additional types', () => {
  it('rejects overly long URL', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2050);
    const ctx = makeContext({ url: longUrl, type: 'headers' });
    const res = await POST(ctx);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.code).toBe('URL_TOO_LONG');
  });

  it('rejects unsupported protocol', async () => {
    const ctx = makeContext({ url: 'ftp://example.com', type: 'headers' });
    const res = await POST(ctx);
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.code).toBe('UNSUPPORTED_PROTOCOL');
  });

  it('social-media-audit basic run', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'social-media-audit' });
    const res = await POST(ctx);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data.findings)).toBe(true);
  }, 15000);

  it('seo-security requires superAdmin to produce findings (otherwise empty)', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'seo-security' });
    const res = await POST(ctx);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data.findings)).toBe(true);
  }, 15000);
});
