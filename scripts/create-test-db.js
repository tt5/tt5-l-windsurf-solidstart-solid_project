import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(process.cwd(), 'data', 'test.db');

async function createTestDb() {
  console.log('Creating test database...');
  
  // Remove existing test database if it exists
  try {
    await fs.unlink(testDbPath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
  
  // Create a new database
  console.log('Opening test database...');
  const db = await open({
    filename: testDbPath,
    driver: sqlite3.Database
  });
  
  try {
    // Create migrations table
    console.log('Creating migrations table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Create user_tables table
    console.log('Creating user_tables table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      )
    `);
    
    // Create base_points table
    console.log('Creating base_points table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS base_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES user_tables(user_id) ON DELETE CASCADE,
        UNIQUE(user_id, x, y)
      )
    `);
    
    // Create indexes
    console.log('Creating indexes...');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);');
    
    // Mark migrations as applied
    console.log('Marking migrations as applied...');
    await db.run("INSERT INTO migrations (name) VALUES ('0001_initial_schema')");
    await db.run("INSERT INTO migrations (name) VALUES ('0002_add_base_points')");
    await db.run("INSERT INTO migrations (name) VALUES ('0003_add_default_base_point')");
    
    // Add a test user
    console.log('Adding test user...');
    await db.run(
      'INSERT INTO user_tables (user_id, table_name) VALUES (?, ?)',
      ['test-user', 'user_test_user']
    );
    
    // Add a test base point
    console.log('Adding test base point...');
    await db.run(
      'INSERT INTO base_points (user_id, x, y) VALUES (?, ?, ?)',
      ['test-user', 0, 0]
    );
    
    console.log('\nTest database created successfully!');
    console.log(`Database path: ${testDbPath}`);
    
  } finally {
    await db.close();
  }
}

createTestDb().catch(error => {
  console.error('Error creating test database:', error);
  process.exit(1);
});
