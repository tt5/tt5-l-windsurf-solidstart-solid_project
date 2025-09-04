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
  
  // Create a simple table
  db.run(`
    CREATE TABLE IF NOT EXISTS test_table (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `, function(err) {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    
    console.log('✅ Created test_table');
    
    // Insert a test row
    db.run(
      "INSERT INTO test_table (name) VALUES (?)",
      ['test'],
      function(err) {
        if (err) {
          console.error('Error inserting row:', err);
          return;
        }
        
        console.log(`✅ Inserted row with ID: ${this.lastID}`);
        
        // Query the data
        db.all("SELECT * FROM test_table", [], (err, rows) => {
          if (err) {
            console.error('Error querying data:', err);
            return;
          }
          
          console.log('✅ Query results:');
          console.table(rows);
          
          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            } else {
              console.log('✅ Closed database connection');
            }
          });
        });
      }
    );
  });
});
