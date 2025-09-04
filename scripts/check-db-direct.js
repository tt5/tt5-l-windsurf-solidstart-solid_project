import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

console.log(`Checking database at: ${dbPath}`);

// Check if file exists
import fs from 'fs';
try {
  const exists = fs.existsSync(dbPath);
  console.log(`Database file exists: ${exists}`);
  if (exists) {
    const stats = fs.statSync(dbPath);
    console.log(`Database size: ${stats.size} bytes`);
    console.log(`Permissions: ${stats.mode.toString(8)}`);
  }
} catch (error) {
  console.error('Error checking file:', error);
}

// Try to open the database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Database opened successfully');
  
  // Try to query the tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error querying tables:', err);
      return;
    }
    
    console.log('Tables in database:', tables);
    
    if (tables && tables.length > 0) {
      // Try to query the migrations table
      db.all("SELECT * FROM migrations", (err, migrations) => {
        if (err) {
          console.error('Error querying migrations:', err);
        } else {
          console.log('Migrations:', migrations);
        }
        db.close();
      });
    } else {
      db.close();
    }
  });
});
