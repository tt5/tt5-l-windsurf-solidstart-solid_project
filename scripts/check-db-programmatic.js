import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

async function checkDb() {
  console.log('Opening database at:', dbPath);
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Successfully opened database');
    
    // Get all tables
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('Tables in database:', tables);
    
    if (tables.length > 0) {
      for (const table of tables) {
        console.log(`\nTable: ${table.name}`);
        try {
          const columns = await db.all(`PRAGMA table_info(${table.name})`);
          console.log('Columns:', columns);
          
          const rows = await db.all(`SELECT * FROM ${table.name} LIMIT 5`);
          console.log('First 5 rows:', rows);
        } catch (error) {
          console.error(`Error querying table ${table.name}:`, error.message);
        }
      }
    } else {
      console.log('No tables found in the database');
    }
    
    await db.close();
  } catch (error) {
    console.error('Error accessing database:', error);
  }
}

checkDb();
