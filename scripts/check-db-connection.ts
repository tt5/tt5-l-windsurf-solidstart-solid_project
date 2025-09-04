import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';

async function checkDbConnection() {
  const dbPath = join(process.cwd(), 'data', 'app.db');
  
  try {
    console.log('Opening database connection...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Database connection successful!');
    
    // Check if migrations table exists
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('Tables in database:');
    console.table(tables);
    
    if (tables.some(t => t.name === 'migrations')) {
      const migrations = await db.all('SELECT * FROM migrations');
      console.log('\nApplied migrations:');
      console.table(migrations);
    }
    
    await db.close();
  } catch (error) {
    console.error('Error checking database connection:', error);
    process.exit(1);
  }
}

checkDbConnection();
