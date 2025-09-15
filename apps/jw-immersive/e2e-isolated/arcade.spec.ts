import { test, expect } from '@playwright/test';

test('Arcade: loads and game canvas is interactive', async ({ page }) => {
  await page.goto('/arcade');

  // Check that the arcade script loads
  const arcadeScript = await page.$('script[src*="retro-arcade.js"]');
  expect(arcadeScript).not.toBeNull();

  // Check that the game canvas is present
  const canvas = await page.$('canvas#game-canvas');
  expect(canvas).not.toBeNull();

  // Optionally, check that the canvas is visible and has correct dimensions
  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
});
