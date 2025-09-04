import { promises as fs } from 'fs';
import { join } from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPath = '/home/n/data/l/windsurf/solidstart/solid-project/data/app.db';

async function verifyDatabase() {
  try {
    // Ensure data directory exists
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    console.log('✅ Data directory verified');
    
    // Try to open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });
    
    console.log('✅ Database connection successful');
    
    // Create users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    console.log('✅ Users table verified');
    
    // Check if there are any users
    const users = await db.all('SELECT * FROM users');
    console.log(`📊 Found ${users.length} users in the database`);
    
    // Add a test user if none exists
    if (users.length === 0) {
      const testUserId = 'test_user_' + Date.now();
      await db.run(
        'INSERT INTO users (id, username) VALUES (?, ?)',
        [testUserId, 'testuser']
      );
      console.log('✅ Added test user');
    }
    
    // Verify the test user was added
    const updatedUsers = await db.all('SELECT * FROM users');
    console.log('Current users:', JSON.stringify(updatedUsers, null, 2));
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase().catch(console.error);
