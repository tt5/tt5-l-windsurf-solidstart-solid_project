import { getDb } from './db';
import * as path from 'path';
import * as fs from 'fs/promises';

let isInitialized = false;

export async function initializeServer() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing server...');
    
    // Ensure data directory exists
    const dbPath = path.join(process.cwd(), 'data');
    await fs.mkdir(dbPath, { recursive: true });
    
    // Initialize database connection
    console.log('Initializing database...');
    await getDb();
    
    console.log('Server initialization complete');
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  } finally {
    isInitialized = true;
  }
}

// For CommonJS compatibility
export default {
  initializeServer
};
