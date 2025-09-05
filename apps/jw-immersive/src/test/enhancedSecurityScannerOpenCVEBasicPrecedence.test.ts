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

describe('OpenCVE auth precedence', () => {
  it('prefers Basic auth over Token when both provided', async () => {
    const originalFetch = globalThis.fetch;
    let authHeader: string | undefined;
    globalThis.fetch = async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if ((url === 'https://example.com' || url === 'https://example.com/') && init?.method === 'HEAD') {
        return new Response('', { status: 200, headers: { 'server': 'nginx/1.26.0' } });
      }
      if (url.startsWith('https://app.opencve.io/api/cve?search=nginx')) {
        authHeader = init?.headers?.Authorization || init?.headers?.authorization;
        return new Response(JSON.stringify({ count: 7, results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
    try {
      const ctx = makeContext(
        { url: 'https://example.com', type: 'cve' },
        {
          OPENCVE_ENRICH: 'true',
          OPENCVE_API_TOKEN: 'tok_zzz',
          OPENCVE_BASIC_USER: 'alice',
          OPENCVE_BASIC_PASS: 's3cret'
        }
      );
      const res = await POST(ctx);
      expect(res.status).toBe(200);
      const data: any = await res.json();
      const ocveFinding = data.findings.find((f: any) => f.title?.includes('OpenCVE references'));
      expect(ocveFinding).toBeTruthy();
      // Basic <base64(alice:s3cret)>
      const expectedPrefix = 'Basic ';
      expect(authHeader?.startsWith(expectedPrefix)).toBe(true);
      // Decode to verify credentials encoded correctly
      const encoded = authHeader!.substring(expectedPrefix.length);
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      expect(decoded).toBe('alice:s3cret');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, 10000);
});
