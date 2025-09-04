import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

console.log(`Verifying database at: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('✅ Connected to database');
  
  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error querying tables:', err);
      return;
    }
    
    console.log('\nTables in database:');
    console.table(tables || []);
    
    if (!tables || tables.length === 0) {
      console.log('No tables found. Creating required tables...');
      
      // Create tables directly
      db.serialize(() => {
        // Create migrations table
        db.run(`
          CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
          )
        `);
        
        // Create user_tables
        db.run(`
          CREATE TABLE IF NOT EXISTS user_tables (
            user_id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL UNIQUE,
            created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
            deleted_at_ms INTEGER
          )
        `);
        
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
        `);
        
        console.log('✅ Created required tables');
        
        // Verify tables were created
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, newTables) => {
          console.log('\nTables after creation:');
          console.table(newTables || []);
          
          // Close the database connection
          db.close();
          console.log('✅ Database connection closed');
        });
      });
    } else {
      // Close the database connection
      db.close();
      console.log('✅ Database connection closed');
    }
  });
});
