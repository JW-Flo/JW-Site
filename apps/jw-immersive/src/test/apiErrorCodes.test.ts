import { describe, it, expect } from 'vitest';
import { POST } from '../pages/api/enhanced-security-scan.js';

function buildRequest(body:any){
  return new Request('http://localhost/api/enhanced-security-scan', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
}

describe('enhanced-security-scan API error codes', () => {
  it('returns URL_TOO_LONG for excessive url length', async () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2100);
    const res = await POST({ request: buildRequest({ url: longUrl, type: 'headers' }) } as any);
    expect(res.status).toBe(400);
  const json: any = await res.json();
  expect(json.code).toBe('URL_TOO_LONG');
  });
  it('returns INVALID_URL for malformed url', async () => {
    const res = await POST({ request: buildRequest({ url: 'ht!tp://', type: 'headers' }) } as any);
    expect(res.status).toBe(400);
  const json: any = await res.json();
  expect(json.code).toBe('INVALID_URL');
  });
});
