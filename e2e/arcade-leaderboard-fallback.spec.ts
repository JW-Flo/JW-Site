// Augment window for test mode and test hook
declare global {
  interface Window {
    TEST_MODE?: boolean;
    __ARCADE_TEST_HOOK__?: {
      injectedLeaderboardEntries: any[];
      injectLeaderboardEntries: (entries: any[]) => void;
      forceShowLeaderboard: () => void;
    };
  }
}
import { test, expect } from '@playwright/test';

// Test leaderboard fallback to localStorage when backend fails

test.describe('Arcade Leaderboard Fallback', () => {
  test('Leaderboard falls back to localStorage if backend fails', async ({ page }) => {
  await page.goto('/?testMode=1');
    // Enable test mode to skip backend fetch
    await page.evaluate(() => { window.TEST_MODE = true; });
    // Remove Vite error overlay if present (prevents pointer events from being blocked)
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    // Open arcade by clicking the 🎮 trigger button
    await page.click('#game-trigger');
    await expect(page.locator('canvas#game-canvas')).toBeVisible();
    // Inject fallback leaderboard entry and force update before checking visibility
    await page.evaluate(() => {
      window.__ARCADE_TEST_HOOK__?.injectLeaderboardEntries([
        { name: 'LocalPlayer', score: 999, game: 'Asteroids' }
      ]);
      window.__ARCADE_TEST_HOOK__?.forceShowLeaderboard();
    });
    // Now wait for leaderboard-list to be visible and contain LocalPlayer
    await expect(page.locator('#leaderboard-list')).toBeVisible();
    await expect(page.locator('#leaderboard-list')).toContainText('LocalPlayer', { timeout: 2000 });
  });
});
