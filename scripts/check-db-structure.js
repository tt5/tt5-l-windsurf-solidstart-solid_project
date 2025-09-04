import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

console.log('Checking database structure at:', dbPath);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }

  console.log('Connected to the database');

  // Get all tables
  db.all("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      process.exit(1);
    }

    console.log('\n=== Tables in database ===');
    if (tables.length === 0) {
      console.log('No tables found in the database');
    } else {
      tables.forEach(table => {
        console.log(`\nTable: ${table.name}`);
        console.log('Schema:', table.sql);
        
        // Get row count
        db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, result) => {
          if (err) {
            console.error(`  Error getting row count: ${err.message}`);
            return;
          }
          console.log(`  Rows: ${result.count}`);
          
          // Get first few rows if any
          if (result.count > 0) {
            db.all(`SELECT * FROM ${table.name} LIMIT 3`, [], (err, rows) => {
              if (err) {
                console.error(`  Error getting rows: ${err.message}`);
                return;
              }
              console.log('  Sample rows:', JSON.stringify(rows, null, 2));
            });
          }
        });
      });
    }
  });

  // Close the database connection after a short delay
  setTimeout(() => {
    db.close();
  }, 1000);
});
