import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(process.cwd(), 'data', 'app.db');

console.log('Running migration: Adding user support to boards...');
const db = new Database(dbPath);

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // Add user_id column to items table
  console.log('Adding user_id column to items table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS items_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT GENERATED ALWAYS AS (datetime(created_at_ms / 1000, 'unixepoch')) VIRTUAL,
      created_at_ms INTEGER DEFAULT (strftime('%s','now') * 1000 + (strftime('%f','now') - strftime('%S','now') * 1000))
    )
  `);

  // Migrate existing data to the new schema with a default user
  console.log('Migrating existing data...');
  db.exec(`
    INSERT INTO items_new (id, user_id, data, created_at_ms)
    SELECT id, 'default', data, created_at_ms FROM items
  `);

  // Drop old table and rename new one
  console.log('Updating table structure...');
  db.exec('DROP TABLE items');
  db.exec('ALTER TABLE items_new RENAME TO items');

  // Create indexes
  console.log('Creating indexes...');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_items_created_ms ON items(created_at_ms)');

  // Commit transaction
  db.exec('COMMIT');
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  db.exec('ROLLBACK');
  process.exit(1);
} finally {
  db.close();
}
