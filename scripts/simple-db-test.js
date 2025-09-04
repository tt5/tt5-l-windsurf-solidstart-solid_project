import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'test.db');

console.log(`Testing SQLite at: ${dbPath}`);

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('✅ Connected to SQLite database');
  
  // Create a table
  db.run(`
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value INTEGER
    )
  `, function(err) {
    if (err) {
      console.error('Error creating table:', err);
      return;
    }
    
    console.log('✅ Created test table');
    
    // Insert a row
    db.run("INSERT INTO test (name, value) VALUES (?, ?)", ['test', 123], function(err) {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      
      console.log(`✅ Inserted row with ID: ${this.lastID}`);
      
      // Query the data
      db.all("SELECT * FROM test", [], (err, rows) => {
        if (err) {
          console.error('Error querying data:', err);
          return;
        }
        
        console.log('✅ Query results:', rows);
        
        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('✅ Closed database connection');
          }
        });
      });
    });
  });
});
