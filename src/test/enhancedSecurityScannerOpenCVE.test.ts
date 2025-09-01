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

describe('OpenCVE enrichment', () => {
  it('adds enrichment finding when OPENCVE_ENRICH enabled and version exposed', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input.url;
      // Normalize example.com URL (Astro route code appends trailing slash when using URL().toString())
      if (url === 'https://example.com' || url === 'https://example.com/') {
        // HEAD request exposing server header
        if (init?.method === 'HEAD') {
          return new Response('', { status: 200, headers: { 'server': 'nginx/1.24.0' } });
        }
      }
      if (url.startsWith('https://app.opencve.io/api/cve?search=nginx')) {
        return new Response(JSON.stringify({ count: 12, results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
    try {
      const ctx = makeContext({ url: 'https://example.com', type: 'cve' }, { OPENCVE_ENRICH: 'true' });
      const res = await POST(ctx);
      expect(res.status).toBe(200);
      const data: any = await res.json();
      const ocveFinding = data.findings.find((f: any) => f.title?.includes('OpenCVE references'));
      expect(ocveFinding).toBeTruthy();
      expect(['medium','info','high']).toContain(ocveFinding.severity);
      expect(ocveFinding.description).toContain('nginx');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, 15000);
});
