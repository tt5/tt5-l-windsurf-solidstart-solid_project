import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

console.log(`Testing database at: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('✅ Connected to database');
  
  // Create tables if they don't exist
  db.serialize(() => {
    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `, (err) => {
      if (err) return console.error('Error creating migrations table:', err);
      console.log('✅ Created migrations table');
    });
    
    // Create user_tables
    db.run(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      )
    `, (err) => {
      if (err) return console.error('Error creating user_tables:', err);
      console.log('✅ Created user_tables');
    });
    
    // Create base_points
    db.run(`
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
    `, (err) => {
      if (err) return console.error('Error creating base_points:', err);
      console.log('✅ Created base_points table');
      
      // Create a test user
      const userId = `test_user_${Date.now()}`;
      const tableName = `user_${userId}_items`;
      
      // Insert test user
      db.run(
        'INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)',
        [userId, tableName],
        function(err) {
          if (err) return console.error('Error inserting user:', err);
          console.log(`✅ Created test user: ${userId}`);
          
          // Insert base point
          db.run(
            'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
            [userId],
            function(err) {
              if (err) return console.error('Error inserting base point:', err);
              console.log(`✅ Created base point for user ${userId}`);
              
              // Query all base points
              db.all('SELECT * FROM base_points WHERE user_id = ?', [userId], (err, rows) => {
                if (err) return console.error('Error querying base points:', err);
                console.log('\nBase points for user:');
                console.table(rows);
                
                // Close the database connection
                db.close((err) => {
                  if (err) console.error('Error closing database:', err);
                  else console.log('✅ Closed database connection');
                });
              });
            }
          );
        }
      );
    });
  });
});
