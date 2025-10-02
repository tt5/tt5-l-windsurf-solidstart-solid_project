import { test, expect } from '@playwright/test';

test.describe('Lightpanda Game', () => {
  test('should load the game page', async ({ page }) => {
    // Navigate to the game URL
    await page.goto('http://localhost:3000');
    
    // Verify the page loaded by checking for a visible element
    await expect(page.locator('body')).toBeVisible();
  });
});
