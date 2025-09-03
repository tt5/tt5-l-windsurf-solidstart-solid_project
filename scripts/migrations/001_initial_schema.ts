import { SqliteDatabase } from '../../src/lib/server/db';

async function up(db: SqliteDatabase) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);
}

async function down(db: SqliteDatabase) {
  await db.exec('DROP TABLE IF EXISTS user_items');
  await db.exec('DROP TABLE IF EXISTS users');
}

export { up, down };
