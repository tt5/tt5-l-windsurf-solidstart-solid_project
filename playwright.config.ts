import { defineConfig, devices } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Port to run the app on during tests
const PORT = 3000;

// Start the dev server and Lightpanda before the tests
const devServer = {
  command: 'npm run dev',
  port: PORT,
  reuseExistingServer: !process.env.CI,
  env: {
    NODE_ENV: 'test',
  },
};

// Lightpanda CDP server configuration
const LIGHTPANDA_PORT = 9222;

// Start Lightpanda CDP server
const lightpandaProcess = spawn('./lightpanda', [
  'serve',
  '--host', '127.0.0.1',
  '--port', LIGHTPANDA_PORT.toString(),
  '--log_level', 'info'
]);

// Log Lightpanda output
lightpandaProcess.stdout.on('data', (data) => {
  console.log(`[Lightpanda] ${data}`);
});

lightpandaProcess.stderr.on('data', (data) => {
  console.error(`[Lightpanda Error] ${data}`);
});

// Ensure Lightpanda is killed when the process exits
process.on('exit', () => {
  if (lightpandaProcess) {
    lightpandaProcess.kill();
  }
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Look for test files in the e2e directory
  testDir: './e2e',
  
  // Timeout for each test in milliseconds
  timeout: 30 * 1000,
  
  // Expect timeout in milliseconds
  expect: {
    timeout: 5000,
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    process.env.CI ? ['github'] : ['line'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: `http://localhost:${PORT}`,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot after each test failure
    screenshot: 'only-on-failure',
    
    // Record video for failed tests
    video: 'on-first-retry',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'lightpanda',
      testDir: 'e2e',
      testMatch: 'lightpanda.test.ts',
      use: {
        // Connect to the Lightpanda CDP server
        browserName: 'chromium',
        // Use the connectOverCDP option to connect to the running Lightpanda instance
        connectOptions: {
          wsEndpoint: `ws://127.0.0.1:${LIGHTPANDA_PORT}`,
          timeout: 30000  // Timeout for the connection
        },
        // Viewport settings
        viewport: { width: 1280, height: 720 },
        // User agent
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Lightpanda/1.0 Chrome/91.0.4472.124 Safari/537.36'
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
