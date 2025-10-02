import { test, expect, chromium, Page, Browser, BrowserContext } from '@playwright/test';

// Helper function to wait for a condition with retries
async function waitForCondition(condition: () => Promise<boolean>, timeout = 10000, interval = 500) {
  const startTime = Date.now();
  let lastError: Error | null = null;

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) return true;
    } catch (error) {
      lastError = error as Error;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw lastError || new Error(`Condition not met within ${timeout}ms`);
}

test.describe('Lightpanda Test', () => {
  let browser: Browser | null = null;
  let page: Page | null = null;
  let context: BrowserContext | null = null;

  test.beforeAll(async () => {
    // No need to manually launch browser, Playwright will handle it based on the project config
    console.log('Setting up Lightpanda browser...');
  });

  test.beforeEach(async ({ browser: testBrowser }) => {
    console.log('Creating new context and page...');
    try {
      // Use the browser instance provided by Playwright test
      browser = testBrowser;
      
      // Create a new context with the Lightpanda configuration
      // The viewport and other settings are already defined in the Playwright config
      context = await browser.newContext({
        ignoreHTTPSErrors: true,
      });
      
      page = await context.newPage();
      page.setDefaultTimeout(30000);
      
      // Add a small delay to ensure the page is ready
      await page.waitForTimeout(1000);
    } catch (error) {
      console.error('Error setting up page:', error);
      throw error;
    }
  });

  test.afterEach(async () => {
    console.log('Cleaning up...');
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (error) {
        console.error('Error closing context:', error);
      }
    }
  });

  test.afterAll(async () => {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser connection closed');
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  });

  test('test with lightpanda', async ({}, testInfo) => {
    testInfo.setTimeout(120000); // 2 minutes
    
    if (!page) {
      throw new Error('Page is not initialized');
    }
    
    console.log('Starting test...');
    
    try {
      // Try to navigate with retry logic
      let retries = 3;
      let lastError: Error | null = null;
      
      while (retries > 0) {
        try {
          console.log(`Navigation attempt ${4 - retries}/3`);
          
          // Use the full URL with retry logic
          await page.goto('http://localhost:3000', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          
          // Wait for network to be idle
          await page.waitForLoadState('networkidle');
          
          // Wait for the page to be stable
          await page.waitForLoadState('networkidle');
          
          // Additional check for page content
          await page.waitForSelector('body', { state: 'attached' });
          
          console.log('Page navigation successful');
          break; // If successful, exit the retry loop
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          lastError = error as Error;
          console.error(`Navigation attempt failed: ${errorMessage}`);
          retries--;
          
          if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (retries === 0 && lastError) {
        throw lastError;
      }
      
      console.log('Page loaded, checking content...');
      
      // Wait for some content to be present
      await waitForCondition(async () => {
        const bodyText = await page!.locator('body').textContent();
        return (bodyText || '').length > 10; // At least some content
      });
      
      const title = await page.title();
      console.log('Page title:', title);
      
      // Take a screenshot with a timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `test-screenshot-${timestamp}.png`;
      await page.screenshot({ path: screenshotPath });
      console.log(`Screenshot saved as ${screenshotPath}`);
      
      // Simple check that the page has some content
      const bodyText = await page.locator('body').textContent();
      console.log('Body content length:', bodyText?.length || 0);
      
      // Basic assertion that the page has content
      expect(bodyText?.length).toBeGreaterThan(10);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Test failed with error:', errorMessage);
      
      // Take a screenshot on failure if possible
      if (page) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const screenshotPath = `test-results/error-${timestamp}.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`Error screenshot saved to ${screenshotPath}`);

          // Try to get page content for debugging
          try {
            const pageContent = await page.content();
            console.log('Page content length:', pageContent.length);
          } catch (contentError) {
            console.error('Failed to get page content:', contentError);
          }
        } catch (screenshotError) {
          console.error('Failed to take error screenshot:', screenshotError);
        }
      }
      throw error; // Re-throw to fail the test
    }
  });
});
