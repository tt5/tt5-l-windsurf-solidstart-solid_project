import { Database } from 'better-sqlite3';

export const description = 'Initial database schema with millisecond precision timestamps';

export function up(db: Database) {
  // Enable foreign key support
  db.pragma('foreign_keys = ON');
  
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      deleted_at_ms INTEGER
    );
  `);

  // User tables registry
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_tables (
      user_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      PRIMARY KEY (user_id, table_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // User items (example of a user-specific table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      deleted_at_ms INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_items_created_at ON user_items(created_at_ms);');
}

export function down(db: Database) {
  // Drop tables in reverse order
  db.exec('DROP TABLE IF EXISTS user_items;');
  db.exec('DROP TABLE IF EXISTS user_tables;');
  db.exec('DROP TABLE IF EXISTS users;');
}
