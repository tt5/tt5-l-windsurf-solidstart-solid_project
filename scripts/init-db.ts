import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

async function initDb() {
  const dbPath = path.join(process.cwd(), 'data', 'app.db');
  
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    
    console.log('Opening database...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
    
    console.log('Creating migrations table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    console.log('Creating users table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    console.log('Creating user_tables table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('Creating base_points table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS base_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, x, y)
      );
    `);

    // Create indexes
    console.log('Creating indexes...');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_table_name ON user_tables(table_name);');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);');

    // Mark migrations as applied
    console.log('Marking migrations as applied...');
    const migrations = [
      '0001_initial_schema',
      '0002_add_base_points',
      '0003_add_default_base_point',
      '0004_add_users_table'
    ];

    for (const migration of migrations) {
      try {
        await db.run("INSERT INTO migrations (name) VALUES (?)", migration);
        console.log(`✓ Marked migration as applied: ${migration}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
          console.log(`- Migration already applied: ${migration}`);
        } else {
          console.error(`Error marking migration ${migration} as applied:`, error);
          throw error;
        }
      }
    }

    // Verify tables were created
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\nDatabase initialized successfully!');
    console.log('Tables created:', tables.map(t => t.name).join(', '));
    
    const appliedMigrations = await db.all('SELECT * FROM migrations');
    console.log('Applied migrations:', appliedMigrations.map(m => m.name).join(', '));
    
    await db.close();
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDb();
