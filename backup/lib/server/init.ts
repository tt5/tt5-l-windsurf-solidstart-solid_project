import { getDb, initializeRepositories, runMigrations } from './db';

let isInitialized = false;

export async function initializeServer() {
  if (isInitialized) return;
  
  try {
    console.log('Initializing server...');
    
    // Initialize database connection
    const db = await getDb();
    
    // Initialize repositories first
    console.log('Initializing repositories...');
    await initializeRepositories();
    
    // Then run migrations
    console.log('Running database migrations...');
    try {
      await runMigrations();
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
    
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
