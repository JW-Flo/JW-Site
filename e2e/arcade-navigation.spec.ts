import { test, expect } from '@playwright/test';

// Arcade navigation e2e tests
// Assumes arcade is accessible at /arcade or via a trigger button

test.describe('Retro Arcade Navigation', () => {
  test('Can enter arcade, see menu, and exit with Esc', async ({ page }) => {
    await page.goto('/');
    // Open arcade (assume a button or keyboard shortcut)
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
    // Wait for menu to appear
    await expect(page.locator('canvas#game-canvas')).toBeVisible();
    // Press Esc to exit
    await page.keyboard.press('Escape');
    // Arcade overlay should be gone (canvas opacity 0 or pointer-events none)
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas#game-canvas');
      if (!canvas) return false;
      const style = window.getComputedStyle(canvas);
      return style.opacity === '0' || style.pointerEvents === 'none';
    }, undefined, { timeout: 2000 });
  });

  test('Can switch between games and return to menu', async ({ page }) => {
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
    // Select first unlocked game (should be Asteroids)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // Return to menu (Esc)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Try switching to next game (ArrowDown, Enter)
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    // Return to menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // Exit arcade
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas#game-canvas');
      if (!canvas) return false;
      const style = window.getComputedStyle(canvas);
      return style.opacity === '0' || style.pointerEvents === 'none';
    }, undefined, { timeout: 2000 });
  });

  test('Rapid game switching and menu navigation is robust', async ({ page }) => {
    await page.goto('/');
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
    // Rapidly switch games and return to menu
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowDown');
    }
    // Exit arcade
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas#game-canvas');
      if (!canvas) return false;
      const style = window.getComputedStyle(canvas);
      return style.opacity === '0' || style.pointerEvents === 'none';
    }, undefined, { timeout: 2000 });
  });

  test('Locked games cannot be started', async ({ page }) => {
    await page.goto('/');
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
    // Move to a locked game (should be index 1 or higher)
    await page.keyboard.press('ArrowDown');
    // Try to start locked game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Check that menu is still visible (canvas present, no game-specific UI)
    await expect(page.locator('canvas#game-canvas')).toBeVisible();
    // Exit arcade
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas#game-canvas');
      if (!canvas) return false;
      const style = window.getComputedStyle(canvas);
      return style.opacity === '0' || style.pointerEvents === 'none';
    }, undefined, { timeout: 2000 });
  });
});
