import { Page, expect } from '@playwright/test';

export class TestUtils {
  constructor(public page: Page) {}

  /**
   * Navigate to a specific route
   */
  async navigateTo(route: string) {
    await this.page.goto(route);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the app to be fully loaded
   */
  async waitForAppToLoad() {
    await this.page.waitForSelector('body', { state: 'attached' });
    // Add any app-specific selectors that indicate the app is loaded
    // For example: await this.page.waitForSelector('.app-loaded');
  }

  /**
   * Get a test user's credentials
   */
  getTestUser() {
    return {
      email: 'test@example.com',
      password: 'test1234',
    };
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${new Date().toISOString()}.png`,
      fullPage: true,
    });
  }
}

/**
 * Helper function to create a test context with common setup
 */
export async function createTestContext({
  page,
  baseURL,
}: {
  page: any;
  baseURL?: string;
}) {
  const utils = new TestUtils(page);
  
  // Set viewport size if needed
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Navigate to the base URL
  if (baseURL) {
    await utils.navigateTo(baseURL);
    await utils.waitForAppToLoad();
  }
  
  return { page, utils };
}
