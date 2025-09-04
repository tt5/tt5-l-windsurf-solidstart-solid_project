import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

console.log(`Testing base points in: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

// Promisify db methods
const run = promisify(db.all.bind(db));
const exec = promisify(db.exec.bind(db));
const get = promisify(db.get.bind(db));

async function testBasePoints() {
  try {
    // Create necessary tables if they don't exist
    await exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      )
    `);
    
    await exec(`
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
    
    console.log('✅ Created necessary tables');
    
    // Create a test user
    const userId = `test_user_${Date.now()}`;
    const tableName = `user_${userId}_items`;
    
    await run("INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)", [userId, tableName]);
    console.log(`✅ Created test user: ${userId}`);
    
    // Create base point
    await run("INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)", [userId]);
    console.log('✅ Created base point (0, 0)');
    
    // Verify base point exists
    const basePoint = await get("SELECT * FROM base_points WHERE user_id = ?", [userId]);
    console.log('\nBase point details:');
    console.table([basePoint]);
    
    // List all base points
    const allBasePoints = await run("SELECT * FROM base_points");
    console.log('\nAll base points in database:');
    console.table(allBasePoints);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
    console.log('✅ Closed database connection');
  }
}

testBasePoints();
