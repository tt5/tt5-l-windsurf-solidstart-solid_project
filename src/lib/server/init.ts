import { getDb, initializeRepositories } from './db';

let isInitialized = false;

export async function initializeServer() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing server...');
    
    // Initialize database connection
    const db = await getDb();
    
    // Initialize repositories
    await initializeRepositories();
    
    isInitialized = true;
    console.log('Server initialization complete');
    return db;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}

// For CommonJS compatibility
export default {
  initializeServer
};
