import { test, expect } from '@playwright/test';

// Demo Reset E2E Test

test.describe('Demo Data Reset', () => {
  test('should reset demo data and show success message', async ({ page }) => {
    await page.goto('/demo-reset');
    await expect(page.locator('h1')).toHaveText('Reset Demo Data');
    await page.click('button:has-text("Reset Demo Data")');
    await expect(page.locator('.text-green-400')).toHaveText('Demo data reset successfully!');
  });
});

// Workflow Builder E2E Test

test.describe('IAM Automation Workflow Builder', () => {
  test('should load users, groups, apps, and requests', async ({ page }) => {
    await page.goto('/workflow-builder');
    await expect(page.locator('h1')).toHaveText('IAM Automation Workflow Builder');
    await expect(page.locator('select')).toHaveCount(3);
    await expect(page.locator('button:has-text("Request")')).toBeVisible();
  });

  test('should request access and show pending request', async ({ page }) => {
    await page.goto('/workflow-builder');
    await page.selectOption('select:nth-of-type(1)', { index: 1 }); // Select first user
    await page.selectOption('select:nth-of-type(2)', { index: 1 }); // Select first group
    await page.selectOption('select:nth-of-type(3)', { index: 1 }); // Select first app
    await page.click('button:has-text("Request")');
    await expect(page.locator('div')).toContainText('Status: pending');
  });
});
