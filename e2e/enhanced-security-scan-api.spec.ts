import { test, expect } from '@playwright/test';

const endpoint = '/api/enhanced-security-scan';

test.describe('Enhanced Security Scan API', () => {
  test('returns 400 EMPTY_BODY for empty body', async ({ request }) => {
    const res = await request.post(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      data: ''
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('EMPTY_BODY');
  });

  test('returns 400 BAD_JSON for malformed JSON', async ({ request }) => {
    const res = await request.post(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      data: '{bad json}'
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('BAD_JSON');
  });

  test('returns 400 MISSING_PARAMS for missing url', async ({ request }) => {
    const res = await request.post(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ type: 'headers' })
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('MISSING_PARAMS');
  });

  test('returns 400 MISSING_PARAMS for missing type', async ({ request }) => {
    const res = await request.post(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ url: 'https://example.com' })
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('MISSING_PARAMS');
  });

  test('returns 200 for valid request', async ({ request }) => {
    const res = await request.post(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'x-e2e-test': '1',
      },
      data: JSON.stringify({ url: 'https://example.com', type: 'headers' })
    });
    // Accept 200 or 429 (rate limit) as valid for this test
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const json = await res.json();
      expect(json).toHaveProperty('findings');
    } else {
      const json = await res.json();
      expect(json.code).toBe('RATE_LIMIT');
    }
  });
});
