import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

async function initTestDb() {
  try {
    const db = await getDb();
    
    // Create user_tables if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      )
    `);

    // Create a test user table
    const userId = 'user_1756834341733'; // The user ID from your logs
    const tableName = `user_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}_items`;
    
    // Create the user's items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);

    // Add the user to user_tables
    await db.run(
      'INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)',
      [userId, tableName]
    );

    // Add a test item
    await db.run(
      `INSERT INTO ${tableName} (data) VALUES (?)`,
      ['Test item for user a']
    );

    console.log('Database initialized with test data');
    console.log(`User ID: ${userId}`);
    console.log(`Table name: ${tableName}`);
  } catch (error) {
    console.error('Error initializing test database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

initTestDb();
