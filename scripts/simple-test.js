import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'test-simple.db');

console.log(`Using database: ${dbPath}`);

// Create a new database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

// Promisify db methods
const run = promisify(db.all.bind(db));
const exec = promisify(db.exec.bind(db));

async function testDatabase() {
  try {
    // Create a simple table
    await exec(`
      CREATE TABLE IF NOT EXISTS test (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        value INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Created test table');

    // Insert a row
    const result = await run("INSERT INTO test (name, value) VALUES (?, ?)", ['test', 123]);
    console.log('✅ Inserted test row');

    // Query the data
    const rows = await run("SELECT * FROM test");
    console.log('✅ Query results:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close the database
    db.close();
    console.log('✅ Closed database connection');
  }
}

testDatabase();
