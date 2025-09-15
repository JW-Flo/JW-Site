import { test, expect } from '@playwright/test';

// External scan test: ensure the scanner API can POST an external URL and receive a structured response
// This does a lightweight 'headers' type scan to minimize runtime while validating end-to-end path.

test.describe('External Security Scan', () => {
  test('scans https://www.awhittlewandering.com with headers type', async ({ request }) => {
    const resp = await request.post('/api/enhanced-security-scan', {
      data: { url: 'https://www.awhittlewandering.com', type: 'headers' },
      headers: {
        'Content-Type': 'application/json',
        'x-e2e-test': '1',
      }
    });
    expect(resp.status(), 'scanner API should return 200 or 202-style success').toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(400);
    const json = await resp.json();
    expect(json).toHaveProperty('result');
    expect(json.result).toHaveProperty('findings');
    expect(Array.isArray(json.result.findings)).toBeTruthy();
    // Basic assertion: at least attempt produced some findings or empty array is still valid structure
    expect(json.result).toHaveProperty('metadata');
  });
});
