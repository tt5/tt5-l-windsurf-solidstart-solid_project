import { APIEvent, json } from "@solidjs/start/server";
import { getDb } from '~/lib/server/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Test query
    const result = await db.get("SELECT name FROM sqlite_master WHERE type='table'");
    
    // Add a test user and item
    const userId = 'user_1756834341733';
    const tableName = `user_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}_items`;
    
    // Ensure user table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      )`);
    
    // Create user's items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )`);
    
    // Add user to user_tables if not exists
    await db.run(
      'INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)',
      [userId, tableName]
    );
    
    // Add a test item
    await db.run(
      `INSERT INTO ${tableName} (data) VALUES (?)`,
      ['Test item for user a']
    );
    
    // Get all items
    const items = await db.all(`SELECT * FROM ${tableName}`);
    
    return json({ 
      success: true, 
      tables: await db.all("SELECT name FROM sqlite_master WHERE type='table'"),
      testItems: items
    });
    
  } catch (error) {
    console.error('Test DB error:', error);
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
