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

describe('enhanced-security-scan superAdminMode', () => {
  const SUPER_ADMIN_KEY = 'test-admin-key';
  it('rejects invalid admin key', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'performance-security', superAdminMode: true, adminKey: 'wrong' }, { SUPER_ADMIN_KEY });
    const res = await POST(ctx);
    expect(res.status).toBe(403);
    const data: any = await res.json();
    expect(data.code).toBe('INVALID_ADMIN_KEY');
  });

  it('runs performance-security scan with valid key', async () => {
    const ctx = makeContext({ url: 'https://example.com', type: 'performance-security', superAdminMode: true, adminKey: SUPER_ADMIN_KEY }, { SUPER_ADMIN_KEY });
    const res = await POST(ctx);
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data.findings)).toBe(true);
  }, 15000);
});
