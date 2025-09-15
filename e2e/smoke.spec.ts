import { test, expect } from '@playwright/test';

test('Home page loads and arcade works', async ({ page, request }) => {
  // Use baseURL for all requests
  await page.goto('/');
  await expect(page).toHaveTitle(/Atlas IT|JW Immersive|Joe Whittle/);

  // Arcade JS loads
  const arcadeScript = await page.$('script[src*="retro-arcade.js"]');
  expect(arcadeScript).not.toBeNull();

  // Asteroids game loads
  await page.goto('/games/AsteroidsGame.js');
  const content = await page.content();
  expect(content).not.toMatch(/404|Not Found/);

  // API endpoint works (should be at root, not under base)
  // Test GET (should 405 Method Not Allowed or 404)
  const getResponse = await request.get('/api/enhanced-security-scan');
  expect([404, 405]).toContain(getResponse.status());

  // Test POST with invalid JSON (should 400)
  const badPost = await request.post('/api/enhanced-security-scan', {
    data: 'not-json',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(badPost.status()).toBe(400);

  // Test POST with valid JSON (should 200 or 400 for missing params)
  const goodPost = await request.post('/api/enhanced-security-scan', {
    data: { url: 'https://example.com', type: 'headers' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect([200, 400]).toContain(goodPost.status());
});
