import { test, expect } from '@playwright/test';
import { lightpanda } from '@lightpanda/browser';

test.describe('Lightpanda Game', () => {
  test('should load the game page', async ({ page }) => {
    // Start Lightpanda browser instance
    const browserProcess = await lightpanda.serve({ 
      port: 9222
    });

    try {
      // Navigate to the game URL
      await page.goto('http://localhost:3000');
      
      // Verify the page loaded
      await expect(page.locator('body')).toBeVisible();
      
      // Example: Interact with page elements
      // await page.click('button.start-game');
      // await expect(page.locator('.game-container')).toBeVisible();
      
    } finally {
      // Ensure the browser process is cleaned up
      browserProcess.kill();
    }
  });

  test('should verify game elements', async ({ page }) => {
    // Start a new Lightpanda browser instance
    const browserProcess = await lightpanda.serve({ 
      port: 9223 // Use a different port for parallel tests
    });

    try {
      await page.goto('http://localhost:3000');
      
      // Wait for game to be interactive
      await page.waitForSelector('body', { state: 'visible' });
      
      // Example: Verify game elements
      // await expect(page.locator('.player')).toBeVisible();
      // await expect(page.locator('.game-board')).toBeVisible();
      
    } finally {
      browserProcess.kill();
    }
  });
});
