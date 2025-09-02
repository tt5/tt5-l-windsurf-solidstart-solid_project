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

// Create database tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT GENERATED ALWAYS AS (datetime(created_at_ms / 1000, 'unixepoch')) VIRTUAL,
    created_at_ms INTEGER DEFAULT (strftime('%s','now') * 1000 + (strftime('%f','now') - strftime('%S','now') * 1000))
  )`);

// Create indexes for better query performance
db.exec('CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_items_created_ms ON items(created_at_ms)');

export interface Item { 
  id: number; 
  user_id: string;
  data: string; 
  created_at: string; 
}

/**
 * Get all items for a specific user
 */
export const getUserItems = (userId: string): Item[] => {
  return db.prepare(`
    SELECT id, user_id, data, 
           datetime(created_at_ms / 1000, 'unixepoch') as created_at 
    FROM items 
    WHERE user_id = ? 
    ORDER BY created_at_ms DESC
  `).all(userId) as Item[];
};

/**
 * Add a new item for a specific user
 */
export const addUserItem = (userId: string, data: string): Item => {
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO items (user_id, data, created_at_ms) VALUES (?, ?, ?)');
  const { lastInsertRowid } = stmt.run(userId, data, now);
  
  // Keep only the last 10 items per user
  db.prepare(`
    DELETE FROM items 
    WHERE user_id = ? AND id NOT IN (
      SELECT id FROM items 
      WHERE user_id = ? 
      ORDER BY created_at_ms DESC 
      LIMIT 10
    )
  `).run(userId, userId);
  
  return { 
    id: Number(lastInsertRowid), 
    user_id: userId, 
    data, 
    created_at: new Date(now).toISOString() 
  };
};

/**
 * Delete all items for a specific user
 */
export const deleteAllUserItems = (userId: string): void => {
  db.prepare('DELETE FROM items WHERE user_id = ?').run(userId);
};

/**
 * Delete a specific item if it belongs to the user
 */
export const deleteUserItem = (userId: string, itemId: number): boolean => {
  const stmt = db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?');
  const result = stmt.run(itemId, userId);
  return result.changes > 0;
};

// Keep the old functions for backward compatibility
export const getAllItems = (): Item[] => {
  console.warn('getAllItems() is deprecated. Use getUserItems(userId) instead.');
  return db.prepare(`
    SELECT id, user_id, data, 
           datetime(created_at_ms / 1000, 'unixepoch') as created_at 
    FROM items 
    ORDER BY created_at_ms DESC 
    LIMIT 10
  `).all() as Item[];
};

export const addItem = (data: string): Item => {
  console.warn('addItem() is deprecated. Use addUserItem(userId, data) instead.');
  return addUserItem('default', data);
};

export const deleteAllItems = (): void => {
  console.warn('deleteAllItems() is deprecated. Use deleteAllUserItems(userId) instead.');
  db.prepare('DELETE FROM items').run();
};

export const deleteItem = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

// Export the database instance for migrations
export { db };
