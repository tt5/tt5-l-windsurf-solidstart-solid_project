import { Database } from 'sqlite';
import { getDb, initializeRepositories } from './db';
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
    const db = await getDb();
    
    // Create tables if they don't exist
    console.log('Ensuring database tables exist...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS base_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, x, y)
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_tables_table_name ON user_tables(table_name);
      CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);
      CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);
    `);
    
    // Initialize repositories
    console.log('Initializing repositories...');
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
