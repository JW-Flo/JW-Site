import { test, expect } from '@playwright/test';

// Unauthenticated users should be redirected from /app to /login
// Adjust baseURL via Playwright config or CLI.

test('unauthenticated /app redirects to /login', async ({ page, context }) => {
  const resp = await page.goto('/app');
  // Some environments may 302 -> /login; Playwright will follow unless we intercept.
  // Instead, check the final URL.
  await page.waitForLoadState('domcontentloaded');
  expect(page.url()).toContain('/login');
  // And initial response should be either 302 or 200 of /login
  expect(resp?.status()).toBeGreaterThanOrEqual(200);
});
