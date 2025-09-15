import { test, expect } from '@playwright/test';

// Test achievement notification UI

test.describe('Arcade Achievements', () => {
  test('Achievement notification appears when criteria met', async ({ page }) => {
    await page.goto('/');
    // Open arcade
    const arcadeBtn = await page.$('button:text("Arcade")');
    if (arcadeBtn) {
      await arcadeBtn.click();
    } else {
      await page.keyboard.down('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Control');
    }
    await expect(page.locator('canvas#game-canvas')).toBeVisible();
    // Simulate first game played achievement
    await page.evaluate(() => {
      window.localStorage.removeItem('retroArcadeAchievements');
      window.localStorage.setItem('retroArcadeLeaderboard', JSON.stringify([
        { name: 'Achiever', score: 100, game: 'Asteroids' }
      ]));
    });
    // Start Asteroids
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Return to menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Check for achievement notification (look for notification div)
    const notification = await page.locator('div').filter({ hasText: 'Achievement' }).first();
    expect(await notification.isVisible()).toBeTruthy();
  });
});
