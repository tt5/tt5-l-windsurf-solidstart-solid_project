import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'test.db');

async function testSimpleDb() {
  console.log('Creating a new test database...');
  
  // Delete existing test database if it exists
  const fs = await import('fs/promises');
  try {
    await fs.unlink(DB_PATH);
    console.log('Removed existing test database');
  } catch (err) {
    console.log('No existing test database to remove');
  }

  // Create a new database
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    // Create a test table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS test (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER DEFAULT 0
      )
    `);
    console.log('Created test table');

    // Insert some test data
    await db.run("INSERT INTO test (name, value) VALUES ('test1', 123)");
    await db.run("INSERT INTO test (name, value) VALUES ('test2', 456)");
    console.log('Inserted test data');

    // Query the data
    const rows = await db.all("SELECT * FROM test");
    console.log('Test data from database:');
    console.table(rows);

    console.log('\n✅ Test completed successfully!');
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await db.close();
  }
}

testSimpleDb();
