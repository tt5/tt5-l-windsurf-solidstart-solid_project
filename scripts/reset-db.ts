import { join } from 'path';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resetDatabase() {
  const dbPath = join(process.cwd(), 'data', 'app.db');
  const backupPath = `${dbPath}.backup-${Date.now()}`;
  
  try {
    // Backup existing database if it exists
    try {
      await fs.access(dbPath);
      await fs.copyFile(dbPath, backupPath);
      console.log(`Backed up existing database to ${backupPath}`);
    } catch (err) {
      console.log('No existing database found, creating a new one...');
    }

    // Delete the existing database
    try {
      await fs.unlink(dbPath);
    } catch (err) {
      // Ignore if file doesn't exist
    }

    // Create a new database with schema
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });

    // Set pragmas
    await (db as any).pragma('journal_mode = WAL');
    await (db as any).pragma('foreign_keys = ON');

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      );
    `);

    console.log('Database reset successfully!');
    console.log(`New database created at: ${dbPath}`);
    
    await db.close();
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
