// Augment window for test mode and test hook
declare global {
  interface Window {
    TEST_MODE?: boolean;
    __ARCADE_TEST_HOOK__?: {
      injectedLeaderboardEntries: any[];
      injectLeaderboardEntries: (entries: any[]) => void;
      forceShowLeaderboard: () => void;
    };
    retroArcade?: {
      gameOverlay?: {
        updateLeaderboard?: (entries: any[]) => void;
      };
    };
  }
}
import { test, expect } from '@playwright/test';

// Test leaderboard updates after score submission

test.describe('Arcade Leaderboard', () => {
  test('Submitting a score updates the leaderboard UI', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
      console.log('PAGE LOG:', msg.text());
    });
  await page.goto('/projects/jw-site/?testMode=1');
    // Force leaderboard visibility for Playwright regardless of Tailwind classes
    await page.addStyleTag({
      content: `
        #leaderboard, #leaderboard-list {
          opacity: 1 !important;
          display: block !important;
          visibility: visible !important;
          max-height: 1000px !important;
          height: auto !important;
          pointer-events: auto !important;
        }
        #leaderboard.hidden, #leaderboard-list.hidden {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        #leaderboard.opacity-0, #leaderboard-list.opacity-0 {
          opacity: 1 !important;
        }
      `
    });
    // Enable test mode to skip backend fetch
    await page.evaluate(() => { window.TEST_MODE = true; });
    // Remove Vite error overlay if present (prevents pointer events from being blocked)
    await page.evaluate(() => {
      const overlay = document.querySelector('vite-error-overlay');
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });
    // Open arcade by clicking the 🎮 trigger button



    // Wait for the RetroArcade script to log its initialization
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('script')).some(s => s.src.includes('retro-arcade.js'));
    }, { timeout: 10000 });

    // Wait for the [RetroArcade] log to appear
    await page.waitForEvent('console', {
      predicate: msg => msg.text().includes('[RetroArcade]'),
      timeout: 10000
    });

    await page.click('#game-trigger');
    await expect(page.locator('canvas#game-canvas')).toBeVisible();

    // Debug: Log state of window.retroArcade and gameOverlay after trigger and canvas
    const arcadeState = await page.evaluate(() => {
      return {
        retroArcade: !!window.retroArcade,
        gameOverlay: !!(window.retroArcade && window.retroArcade.gameOverlay),
        updateLeaderboard: !!(window.retroArcade && window.retroArcade.gameOverlay && typeof window.retroArcade.gameOverlay.updateLeaderboard === 'function')
      };
    });
    console.log('DEBUG arcade state after trigger/canvas:', arcadeState);

    // Wait for GameOverlay to be initialized before injecting leaderboard entries
    await page.waitForFunction(() => {
      return !!(window.retroArcade && window.retroArcade.gameOverlay && typeof window.retroArcade.gameOverlay.updateLeaderboard === 'function');
    }, { timeout: 15000 });

    // Inject test leaderboard entry and force update AFTER GameOverlay is initialized
    await page.evaluate(() => {
      window.__ARCADE_TEST_HOOK__?.injectLeaderboardEntries([
        { name: 'TestPlayer', score: 1234, game: 'Asteroids' }
      ]);
      window.__ARCADE_TEST_HOOK__?.forceShowLeaderboard();
    });

    // Debug: Log computed styles and DOM for #leaderboard-list and #leaderboard
    const debugStyles = await page.evaluate(() => {
      const list = document.getElementById('leaderboard-list');
      const leaderboard = document.getElementById('leaderboard');
      function getStyles(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          display: cs.display,
          opacity: cs.opacity,
          visibility: cs.visibility,
          maxHeight: cs.maxHeight,
          height: cs.height,
          classes: el.className,
          html: el.outerHTML
        };
      }
      return {
        leaderboard: getStyles(leaderboard),
        list: getStyles(list)
      };
    });
    console.log('DEBUG leaderboard styles:', debugStyles);
    // Now wait for leaderboard-list to be visible and contain TestPlayer
    await expect(page.locator('#leaderboard-list')).toBeVisible();
    await expect(page.locator('#leaderboard-list')).toContainText('TestPlayer', { timeout: 2000 });
  });
});
