import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

console.log('Checking database at:', dbPath);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }

  console.log('Connected to the database');

  // Get all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      return;
    }

    console.log('Tables in database:', tables);

    // If no tables, exit
    if (!tables || tables.length === 0) {
      console.log('No tables found in the database');
      db.close();
      return;
    }

    // For each table, get its schema and first few rows
    let tablesProcessed = 0;
    tables.forEach((table) => {
      const tableName = table.name;
      
      // Get table schema
      db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
        if (err) {
          console.error(`Error getting schema for table ${tableName}:`, err.message);
          return;
        }
        
        console.log(`\nTable: ${tableName}`);
        console.log('Columns:', columns.map(c => `${c.name} (${c.type})`).join(', '));
        
        // Get first 3 rows
        db.all(`SELECT * FROM ${tableName} LIMIT 3`, [], (err, rows) => {
          if (err) {
            console.error(`Error querying table ${tableName}:`, err.message);
          } else {
            console.log(`First ${rows.length} rows:`, rows);
          }
          
          // Close connection after processing all tables
          tablesProcessed++;
          if (tablesProcessed === tables.length) {
            db.close();
          }
        });
      });
    });
  });
});
