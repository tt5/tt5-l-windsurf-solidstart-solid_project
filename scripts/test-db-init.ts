import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(process.cwd(), 'data', 'app.db');

async function testDb() {
  console.log('Testing database connection...');
  console.log('Database path:', dbPath);
  
  try {
    // Open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });

    console.log('✅ Database connection successful');

    // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    console.log('✅ Users table created');

    // Check if table exists
    const tableInfo = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );
    console.log('Table info:', tableInfo);

    // Insert a test user
    const testUserId = 'test_user_' + Date.now();
    await db.run(
      'INSERT INTO users (id, username) VALUES (?, ?)',
      [testUserId, 'testuser']
    );
    console.log('✅ Test user inserted');

    // Query users
    const users = await db.all('SELECT * FROM users');
    console.log('Users in database:', users);

    await db.close();
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

testDb().catch(console.error);
