import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

console.log(`Testing database connection to: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('✅ Database opened successfully');
  
  // Helper function to run queries
  const run = promisify(db.all.bind(db));
  const exec = promisify(db.exec.bind(db));
  
  try {
    // Create tables if they don't exist
    console.log('\nCreating tables if they don\'t exist...');
    await exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS base_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES user_tables(user_id) ON DELETE CASCADE,
        UNIQUE(user_id, x, y)
      );
    `);
    
    console.log('✅ Tables created successfully');
    
    // Insert test data
    console.log('\nInserting test data...');
    const testUserId = `test_user_${Date.now()}`;
    
    // Insert user
    await exec(`
      INSERT OR IGNORE INTO user_tables (user_id, table_name)
      VALUES ('${testUserId}', 'user_${testUserId}_items')
    `);
    
    // Insert base point
    await exec(`
      INSERT OR IGNORE INTO base_points (user_id, x, y)
      VALUES ('${testUserId}', 0, 0)
    `);
    
    console.log('✅ Test data inserted successfully');
    
    // Verify data
    console.log('\nVerifying data...');
    const users = await run('SELECT * FROM user_tables');
    const points = await run('SELECT * FROM base_points');
    
    console.log('Users:', users);
    console.log('Base points:', points);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close the database connection
    db.close();
  }
});
