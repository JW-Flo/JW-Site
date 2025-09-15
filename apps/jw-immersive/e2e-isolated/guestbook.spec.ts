// Add global declaration for Playwright test flag
declare global {
  interface Window {
    __PLAYWRIGHT_GUESTBOOK_ENTRY_RENDERED?: boolean;
  }
}
import { test, expect } from '@playwright/test';

test('Guestbook: submit and display message', async ({ page }) => {
  await page.goto('/guestbook');

  // Fill out the guestbook form (adjust selectors as needed)
  await page.fill('input[name="name"]', 'Playwright Test User');
  await page.fill('textarea[name="message"]', 'This is a test message from Playwright.');
  await page.click('button[type="submit"]');

  // Wait for the .guestbook-entry to appear (max 5s)
  await page.waitForSelector('.guestbook-entry', { timeout: 5000 });
  // Optionally, wait for the global flag
  await page.waitForFunction(() => window.__PLAYWRIGHT_GUESTBOOK_ENTRY_RENDERED === true, null, { timeout: 5000 });
  // Now assert the text
  await expect(page.locator('.guestbook-entry')).toContainText('This is a test message from Playwright');
  await expect(page.locator('.guestbook-entry')).toContainText('Playwright Test User');
});
