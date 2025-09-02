import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(process.cwd(), 'data', 'app.db');

// Initialize database
await fs.mkdir(dirname(dbPath), { recursive: true }).catch(() => {});
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create database tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS user_tables (
    user_id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL UNIQUE,
    created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  )`);

// Create a function to get or create a user's table
function ensureUserTable(userId: string): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const tableName = `user_${safeUserId}_items`;
  
  // Check if table exists
  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName);
  
  if (!tableExists) {
    // Create the user's items table
    db.exec(`
      CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    
    // Register the user table
    db.prepare(`
      INSERT OR IGNORE INTO user_tables (user_id, table_name)
      VALUES (?, ?)
    `).run(userId, tableName);
  }
  
  return tableName;
}

export interface Item { 
  id: number;
  user_id?: string;  // Optional since it's not stored in user tables
  data: string;
  created_at_ms?: number;
  created_at?: string; // Virtual column
}

/**
 * Get all items for a specific user
 */
export const getUserItems = (userId: string): Item[] => {
  const tableName = ensureUserTable(userId);
  return db.prepare(`
    SELECT id, 
           data, 
           created_at_ms,
           datetime(created_at_ms / 1000, 'unixepoch') as created_at
    FROM ${tableName}
    ORDER BY created_at_ms DESC
  `).all().map((item: any) => ({
    ...item,
    user_id: userId // Add user_id to maintain backward compatibility
  })) as Item[];
};

/**
 * Add a new item for a specific user
 */
export const addUserItem = (userId: string, data: string): Item => {
  const tableName = ensureUserTable(userId);
  const now = Date.now();
  
  const result = db.prepare(`
    INSERT INTO ${tableName} (data, created_at_ms)
    VALUES (?, ?)
    RETURNING id, data, created_at_ms,
             datetime(created_at_ms / 1000, 'unixepoch') as created_at
  `).get(data, now) as any;
  
  return {
    ...result,
    user_id: userId // Add user_id to maintain backward compatibility
  };
};

/**
 * Delete all items for a specific user
 */
export const deleteAllUserItems = (userId: string): void => {
  const tableName = ensureUserTable(userId);
  db.prepare(`DELETE FROM ${tableName}`).run();
};

/**
 * Delete a specific item if it belongs to the user
 */
export const deleteUserItem = (userId: string, itemId: number): boolean => {
  const tableName = ensureUserTable(userId);
  const result = db.prepare(`
    DELETE FROM ${tableName} 
    WHERE id = ?
  `).run(itemId);
  
  return result.changes > 0;
};

// Keep the old functions for backward compatibility
export const getAllItems = (): Item[] => {
  console.warn('getAllItems() is deprecated. Use getUserItems(userId) instead.');
  // This is now more complex with user-specific tables
  // We'll use the vw_items view that was created during migration
  return db.prepare(`
    SELECT id, user_id, data, created_at_ms,
           datetime(created_at_ms / 1000, 'unixepoch') as created_at 
    FROM vw_items 
    ORDER BY created_at_ms DESC
  `).all() as Item[];
};

export const addItem = (data: string): Item => {
  console.warn('addItem() is deprecated. Use addUserItem(userId, data) instead.');
  return addUserItem('default', data);
};

export const deleteAllItems = (): void => {
  console.warn('deleteAllItems() is deprecated. Use deleteAllUserItems(userId) instead.');
  // This will delete from all user tables
  const userTables = db.prepare('SELECT table_name FROM user_tables').all() as Array<{table_name: string}>;
  for (const { table_name } of userTables) {
    db.prepare(`DELETE FROM ${table_name}`).run();
  }
};

export const deleteItem = (id: number): boolean => {
  console.warn('deleteItem() is deprecated. Use deleteUserItem(userId, id) instead.');
  // This is now more complex with user-specific tables
  // We need to find which user's table contains this ID
  const userTables = db.prepare('SELECT user_id, table_name FROM user_tables').all() as Array<{user_id: string, table_name: string}>;
  
  for (const { user_id, table_name } of userTables) {
    const result = db.prepare(`
      DELETE FROM ${table_name} 
      WHERE id = ?
    `).run(id);
    
    if (result.changes > 0) {
      return true;
    }
  }
  
  return false;
};

// Export the database instance for migrations
export { db };
