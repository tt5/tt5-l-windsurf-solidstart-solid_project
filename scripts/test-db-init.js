import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';

async function testDbInit() {
  const dbPath = path.join(process.cwd(), 'data', 'test-app.db');
  let db;
  
  try {
    // Remove test database if it exists
    try { await fs.unlink(dbPath); } catch {}
    
    console.log('Creating test database...');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Create migrations table
    console.log('Creating migrations table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);
    
    // Test migrations table
    console.log('Testing migrations table...');
    await db.run('INSERT INTO migrations (name) VALUES (?)', ['test_migration']);
    const migrations = await db.all('SELECT * FROM migrations');
    console.log('Migrations:', migrations);
    
    // Test creating user_tables
    console.log('Creating user_tables...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      );
    `);
    
    // Test inserting a user
    console.log('Testing user insertion...');
    await db.run(
      'INSERT INTO user_tables (user_id, table_name) VALUES (?, ?)',
      ['test-user', 'user_test_user']
    );
    
    const users = await db.all('SELECT * FROM user_tables');
    console.log('Users:', users);
    
    console.log('All tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    if (db) await db.close();
  }
}

testDbInit();
