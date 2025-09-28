import { test, expect } from '@playwright/test';
import { createTestContext } from '../utils/test-utils';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page, baseURL }) => {
    const { utils } = await createTestContext({ page, baseURL });
    
    // Verify the page title
    await expect(page).toHaveTitle(/Superstar/);
    
    // Take a screenshot for reference
    await utils.takeScreenshot('home-page');
    
    // Add more assertions based on your app's home page
    // For example:
    // await expect(page.locator('h1')).toContainText('Welcome');
  });
});
