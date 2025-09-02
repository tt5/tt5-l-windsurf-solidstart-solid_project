import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { assertServer } from './utils';

const dbPath = join(process.cwd(), 'data', 'app.db');

// Initialize database
let db: Database;

async function getDb() {
  assertServer();
  
  if (!db) {
    console.log('Initializing database...');
    
    try {
      // Ensure data directory exists
      await fs.mkdir(dirname(dbPath), { recursive: true });
      
      // Initialize SQLite database with better-sqlite3 for better error handling
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
      });
      
      // Set pragmas
      await db.pragma('journal_mode = WAL');
      await db.pragma('foreign_keys = ON');
      
      // Create tables with error handling
      try {
        await db.exec(`
          CREATE TABLE IF NOT EXISTS user_tables (
            user_id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL UNIQUE,
            created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
            deleted_at_ms INTEGER
          );
        `);
        
        console.log('Database tables verified/created');
      } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
  
  return db;
}

// Create a function to get or create a user's table
async function ensureUserTable(userId: string): Promise<string> {
  const db = await getDb();
  const safeUserId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const tableName = `user_${safeUserId}_items`;
  
  // Check if table exists
  const tableExists = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  
  if (!tableExists) {
    // Create the user's items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    
    // Register the user table
    await db.run(
      'INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)',
      [userId, tableName]
    );
  }
  
  return tableName;
}

export interface Item { 
  id: number;
  user_id?: string;
  data: string;
  created_at_ms?: number;
  created_at?: string;
}

/**
 * Get all items for a specific user
 */
export const getUserItems = async (userId: string): Promise<Item[]> => {
  try {
    console.log(`Fetching items for user: ${userId}`);
    const tableName = await ensureUserTable(userId);
    console.log(`Using table: ${tableName}`);
    
    const db = await getDb();
    const query = `
      SELECT id, data, created_at_ms as createdAtMs
      FROM ${tableName}
      ORDER BY created_at_ms DESC
    `;
    
    console.log('Executing query:', query);
    const items = await db.all(query);
    console.log(`Found ${items.length} items`);
    
    return items.map((item: any) => ({
      ...item,
      created_at: new Date(item.createdAtMs).toISOString()
    }));
  } catch (error) {
    console.error('Error in getUserItems:', error);
    throw new Error(`Failed to fetch items: ${error.message}`);
  }
};

/**
 * Add a new item for a specific user
 */
export const addUserItem = async (userId: string, data: string): Promise<Item> => {
  const tableName = await ensureUserTable(userId);
  const db = await getDb();
  
  const result = await db.run(
    `INSERT INTO ${tableName} (data) VALUES (?)`,
    [data]
  );
  
  const item = await db.get(
    `SELECT id, data, created_at_ms as createdAtMs
     FROM ${tableName}
     WHERE id = ?`,
    [result.lastID]
  );
  
  return {
    ...item,
    created_at: new Date(item.createdAtMs).toISOString()
  };
};

/**
 * Delete all items for a specific user
 */
export const deleteAllUserItems = async (userId: string): Promise<void> => {
  const tableName = await ensureUserTable(userId);
  const db = await getDb();
  await db.run(`DELETE FROM ${tableName}`);
};

/**
 * Delete a specific item if it belongs to the user
 */
export const deleteUserItem = async (userId: string, itemId: number): Promise<boolean> => {
  const tableName = await ensureUserTable(userId);
  const db = await getDb();
  const result = await db.run(
    `DELETE FROM ${tableName} WHERE id = ?`,
    [itemId]
  );
  
  return result.changes > 0;
};

export { getDb };
