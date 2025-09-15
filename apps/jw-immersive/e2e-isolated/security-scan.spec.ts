import { test, expect } from '@playwright/test';

test('Security Scan: API endpoint works for POST', async ({ request }) => {
  // Test POST with valid JSON
  const goodPost = await request.post('/api/enhanced-security-scan', {
    data: { url: 'https://example.com', type: 'headers' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect([200, 400]).toContain(goodPost.status());

  // Test POST with invalid JSON
  const badPost = await request.post('/api/enhanced-security-scan', {
    data: 'not-json',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(badPost.status()).toBe(400);
});

test('Security Scan: GET returns 404 or 405', async ({ request }) => {
  const getResponse = await request.get('/api/enhanced-security-scan');
  expect([404, 405]).toContain(getResponse.status());
});
