import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { assertServer } from './utils';
import { UserItemRepository } from './repositories/user-item.repository';

export type SqliteDatabase = Database<sqlite3.Database, sqlite3.Statement>;

const dbPath = join(process.cwd(), 'data', 'app.db');

// Initialize database
let db: SqliteDatabase;
let userItemRepo: UserItemRepository | null = null;

async function getDb(): Promise<SqliteDatabase> {
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
      
      // Set pragmas using exec
      await db.exec('PRAGMA journal_mode = WAL;');
      await db.exec('PRAGMA foreign_keys = ON;');
      
      // Create tables with error handling
      try {
        // First create user_tables if it doesn't exist
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
  
  try {
    // First ensure user_tables exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      );
    `);
    
    // Check if table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    
    if (!tableExists) {
      // Create the user's items table with millisecond precision
      await db.exec(`
        CREATE TABLE ${tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL,
          created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
        )
      `);
      
      // Register the user table
      await db.run(
        'INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)',
        [userId, tableName]
      );
    }
  
  } catch (error) {
    console.error('Error in ensureUserTable:', error);
    throw error;
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
  ) as { changes?: number };
  
  return (result.changes ?? 0) > 0;
};

/**
 * Delete a user and all their data
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  const db = await getDb();
  const userTableName = `user_${userId}_items`;
  
  try {
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Remove user from user_tables and drop their items table
      await db.run('DELETE FROM user_tables WHERE user_id = ?', [userId]);
      await db.exec(`DROP TABLE IF EXISTS ${userTableName}`);
      
      await db.exec('COMMIT');
      console.log(`[deleteUser] Successfully deleted user data for: ${userId}`);
      return true;
      
    } catch (error) {
      // Rollback in case of any error
      await db.exec('ROLLBACK');
      console.error('Error in user deletion transaction:', error);
      return false;
    }
    
  } catch (error) {
    console.error('Error during user deletion:', error);
    return false;
  }
};

function getUserItemRepository(): UserItemRepository {
  if (!userItemRepo) {
    throw new Error('Database not initialized. Call getDb() first.');
  }
  return userItemRepo;
}

// Initialize repositories when the database is ready
async function initializeRepositories() {
  if (!db) await getDb();
  userItemRepo = new UserItemRepository(db);
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
  `);
}

export { 
  getDb, 
  getUserItemRepository,
  initializeRepositories 
};
