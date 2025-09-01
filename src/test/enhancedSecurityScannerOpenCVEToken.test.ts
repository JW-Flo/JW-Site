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

describe('OpenCVE token usage', () => {
  it('sends Authorization header when OPENCVE_API_TOKEN set', async () => {
    const originalFetch = globalThis.fetch;
    let authHeader: string | undefined;
    globalThis.fetch = async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if ((url === 'https://example.com' || url === 'https://example.com/') && init?.method === 'HEAD') {
        return new Response('', { status: 200, headers: { 'server': 'nginx/1.25.1' } });
      }
      if (url.startsWith('https://app.opencve.io/api/cve?search=nginx')) {
        authHeader = init?.headers?.Authorization || init?.headers?.authorization;
        return new Response(JSON.stringify({ count: 3, results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
    try {
      const ctx = makeContext({ url: 'https://example.com', type: 'cve' }, { OPENCVE_ENRICH: 'true', OPENCVE_API_TOKEN: 'abc123' });
      const res = await POST(ctx);
      expect(res.status).toBe(200);
      const data: any = await res.json();
      const tokenFinding = data.findings.find((f: any) => f.title?.includes('OpenCVE references'));
      expect(tokenFinding).toBeTruthy();
      expect(authHeader).toBe('Token abc123');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, 10000);
});
