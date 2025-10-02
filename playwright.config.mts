import { defineConfig, devices } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'net';

// Lightpanda CDP server configuration
export const LIGHTPANDA_PORT = 9292; // Default port, will be incremented if in use

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

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

// Function to check if a port is available
const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    
    server.listen(port);
  });
};

// Function to find an available port
const findAvailablePort = async (startPort: number, maxAttempts = 10): Promise<number> => {
  let port = startPort;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const available = await isPortAvailable(port);
    
    if (available) {
      return port;
    }
    
    port++;
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error(`Could not find available port after ${maxAttempts} attempts`);
    }
  }
  
  throw new Error(`Could not find available port after ${maxAttempts} attempts`);
};

// Configuration for the Lightpanda server process
const createLightpandaServer = async () => {
  // Get an available port
  const availablePort = await findAvailablePort(LIGHTPANDA_PORT);
  console.log(`Using Lightpanda port: ${availablePort}`);
  
  return {
    command: process.platform === 'win32' ? 'lightpanda.cmd' : './lightpanda',
    args: [
      'serve',
      '--host', '127.0.0.1',
      '--port', availablePort.toString(),
      '--log_level', 'debug',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ],
    port: availablePort,
    reuseExistingServer: false, // Always start fresh
    debug: true,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 30000, // 30 seconds timeout
    env: {
      ...process.env,
      NODE_ENV: 'test',
      NO_COLOR: '1', // Disable colors in logs for better parsing
      FORCE_COLOR: '0'
    },
    // Retry logic
    retries: 3,
    retryDelay: 1000, // 1 second between retries
    // Kill any existing process using the port
    setup: async () => {
      try {
        if (process.platform === 'win32') {
          execSync(`FOR /F "tokens=5" %i IN ('netstat -ano ^| find "${availablePort}" ^| find "LISTENING"') DO taskkill /F /PID %i`, { stdio: 'ignore' });
        } else {
          execSync(`lsof -ti:${availablePort} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
        }
      } catch (error) {
        console.warn('Error cleaning up processes:', error);
      }
    }
  };
};

// Create and export the server configuration
export const lightpandaServer = await createLightpandaServer();

// Helper to get the port from the server config
export const getLightpandaPort = async () => {
  const server = await lightpandaServer;
  return server.port;
};

// Helper to get the WebSocket URL for the server
export const getLightpandaWsUrl = async () => {
  const port = await getLightpandaPort();
  return `ws://localhost:${port}`;
};


/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  globalSetup: './global-setup.mts',
  
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
      timeout: 120000, // Increase timeout for Lightpanda tests
      use: {
        // We'll handle the connection manually in the test file
        // Using connectOverCDP requires custom setup in the test file
        browserName: 'chromium',
        // Viewport settings
        viewport: { width: 1280, height: 720 },
        // User agent
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Lightpanda/1.0 Chrome/91.0.4472.124 Safari/537.36',
        // Additional context options
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        // Add any other necessary options here
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
