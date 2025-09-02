import { getDb } from '../../src/lib/server/db';
import { SqliteDatabase } from '../../src/lib/server/db';

async function up(db: SqliteDatabase) {
  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      deleted_at_ms INTEGER
    );
  `);

  // Create user_items table with foreign key
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

async function down(db: SqliteDatabase) {
  await db.exec('DROP TABLE IF EXISTS user_items');
  await db.exec('DROP TABLE IF EXISTS users');
}

export { up, down };
