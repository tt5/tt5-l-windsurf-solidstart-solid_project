import { join } from 'path';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTables(db: Database) {
  // Create user_tables first
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_tables (
      user_id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      deleted_at_ms INTEGER
    );
  `);

  // Create any other necessary tables here
  // Example:
  // await db.exec(`
  //   CREATE TABLE IF NOT EXISTS another_table (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     user_id TEXT,
  //     data TEXT,
  //     created_at_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  //     FOREIGN KEY (user_id) REFERENCES user_tables(user_id) ON DELETE CASCADE
  //   );
  // `);
}

async function resetDatabase() {
  const dbPath = join(process.cwd(), 'data', 'app.db');
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  let db: Database | null = null;
  
  try {
    // Backup existing database if it exists
    try {
      await fs.access(dbPath);
      await fs.copyFile(dbPath, backupPath);
      console.log(`✅ Backed up existing database to ${backupPath}`);
    } catch (err) {
      console.log('ℹ️ No existing database found, creating a new one...');
    }

    // Ensure data directory exists
    await fs.mkdir(dirname(dbPath), { recursive: true });

    // Delete the existing database
    try {
      await fs.unlink(dbPath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('❌ Error removing old database:', err);
        throw err;
      }
    }

    // Create a new database with schema
    console.log('🔧 Creating new database...');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX
    });

    // Set pragmas using exec
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA temp_store = MEMORY;');

    // Create all tables
    console.log('📝 Creating database tables...');
    await createTables(db);

    console.log('✅ Database reset successfully!');
    console.log(`🔗 New database created at: ${dbPath}`);
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (err) {
        console.error('❌ Error closing database:', err);
      }
    }
  }
}

// Run the reset if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };
