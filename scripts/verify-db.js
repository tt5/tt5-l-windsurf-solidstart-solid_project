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

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  
  console.log('Database opened successfully');
  
  // Helper function to run queries
  const run = promisify(db.all.bind(db));
  
  try {
    // Check tables
    const tables = await run("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables);
    
    // Check migrations table
    try {
      const migrations = await run('SELECT * FROM migrations');
      console.log('Migrations:', migrations);
    } catch (e) {
      console.log('Migrations table does not exist or is empty');
    }
    
    // Check user_tables
    try {
      const userTables = await run('SELECT * FROM user_tables');
      console.log('User tables:', userTables);
    } catch (e) {
      console.log('user_tables does not exist or is empty');
    }
    
    // Check base_points
    try {
      const basePoints = await run('SELECT * FROM base_points');
      console.log('Base points:', basePoints);
    } catch (e) {
      console.log('base_points table does not exist or is empty');
    }
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    // Close the database connection
    db.close();
  }
});
