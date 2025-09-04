import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function testDb() {
  try {
    console.log('Opening database...');
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'app.db'),
      driver: sqlite3.Database
    });

    console.log('Database opened successfully!');

    // List all tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables);

    // Check migrations table
    try {
      const migrations = await db.all('SELECT * FROM migrations');
      console.log('Migrations:', migrations);
    } catch (error) {
      console.error('Error querying migrations table:', error);
    }

    // Try to create a simple table
    try {
      console.log('Creating test table...');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
      `);
      console.log('Test table created successfully!');
    } catch (error) {
      console.error('Error creating test table:', error);
    }

  } catch (error) {
    console.error('Database error:', error);
  }
}

testDb();
