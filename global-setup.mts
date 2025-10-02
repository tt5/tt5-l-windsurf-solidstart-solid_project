import { FullConfig, chromium } from '@playwright/test';
import { LIGHTPANDA_PORT, lightpandaServer } from './playwright.config.mjs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import net from 'net';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Starting Lightpanda server...');
  
  // Start the Lightpanda server
  const server = spawn(lightpandaServer.command, lightpandaServer.args, {
    env: lightpandaServer.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Log server output
  server.stdout?.on('data', (data) => {
    console.log(`[Lightpanda] ${data}`);
  });

  server.stderr?.on('data', (data) => {
    console.error(`[Lightpanda Error] ${data}`);
  });

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for Lightpanda server to start'));
    }, 10000);

    const checkServer = () => {
      const client = new net.Socket();
    
      client.on('error', () => {
        // Connection failed, try again in 100ms
        setTimeout(checkServer, 100);
      });
      
      client.connect(LIGHTPANDA_PORT, '127.0.0.1', () => {
        clearTimeout(timeout);
        client.end();
        console.log('Lightpanda server is ready');
        resolve();
      });
    };

    checkServer();
  });

  // Store the server process for teardown
  (global as any).__LIGHTPANDA_SERVER__ = server;
}

// Clean up function
export async function teardown() {
  const server = (global as any).__LIGHTPANDA_SERVER__;
  if (server) {
    console.log('Global teardown: Stopping Lightpanda server...');
    
    // Try graceful shutdown first
    server.kill('SIGTERM');
    
    // Force kill if not terminated after 3 seconds
    const forceKill = setTimeout(() => {
      if (!server.killed) {
        console.log('Force killing Lightpanda server...');
        server.kill('SIGKILL');
      }
    }, 3000);
    
    await new Promise<void>((resolve) => {
      server.once('exit', () => {
        clearTimeout(forceKill);
        console.log('Lightpanda server stopped');
        resolve();
      });
      
      // In case the process is already dead
      if (server.killed) {
        clearTimeout(forceKill);
        console.log('Lightpanda server already stopped');
        resolve();
      }
    });
    
    // Clean up the reference
    delete (global as any).__LIGHTPANDA_SERVER__;
  }
}

// Handle process termination
const handleExit = async () => {
  await teardown();
  process.exit(0);
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

export default globalSetup;
