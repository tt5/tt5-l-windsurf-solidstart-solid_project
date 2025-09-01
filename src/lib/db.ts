import Database from 'better-sqlite3';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

const dbPath = join(process.cwd(), 'data', 'app.db');

// Initialize database
await fs.mkdir(dirname(dbPath), { recursive: true }).catch(() => {});
const db = new Database(dbPath);

// Create database tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at TEXT GENERATED ALWAYS AS (datetime(created_at_ms / 1000, 'unixepoch')) VIRTUAL,
    created_at_ms INTEGER DEFAULT (strftime('%s','now') * 1000 + (strftime('%f','now') - strftime('%S','now') * 1000))
  )`);

// Create an index for better query performance
db.exec('CREATE INDEX IF NOT EXISTS idx_items_created_ms ON items(created_at_ms)');

// Insert initial data if empty
if (!db.prepare('SELECT 1 FROM items LIMIT 1').get()) {
  db.prepare('INSERT INTO items (data) VALUES (?)').run('[0, 2, 4, 6, 8]');
}

export interface Item { id: number; data: string; created_at: string; }

export const getAllItems = (): Item[] => 
  db.prepare('SELECT id, data, datetime(created_at_ms / 1000, \'unixepoch\') as created_at FROM items ORDER BY created_at_ms DESC LIMIT 10').all() as Item[];

export const addItem = (data: string) => {
  const now = Date.now();
  const { lastInsertRowid } = db.prepare('INSERT INTO items (data, created_at_ms) VALUES (?, ?)').run(data, now);
  db.prepare('DELETE FROM items WHERE id NOT IN (SELECT id FROM items ORDER BY created_at_ms DESC LIMIT 10)').run();
  return { id: lastInsertRowid as number };
};

export const deleteItem = (id: number): boolean => 
  db.prepare('DELETE FROM items WHERE id = ?').run(id).changes > 0;

export const deleteAllItems = () => 
  ({ count: db.prepare('DELETE FROM items').run().changes });
