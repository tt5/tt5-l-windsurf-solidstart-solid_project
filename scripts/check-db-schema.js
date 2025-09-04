import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

console.log('Checking database schema at:', dbPath);

// Create a new database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }

  console.log('Connected to the database');

  // Get all tables
  db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      return;
    }

    console.log('\n=== Tables in database ===');
    tables.forEach(table => {
      console.log(`\nTable: ${table.name}`);
      console.log('Schema:', table.sql);
    });

    // Get migrations
    db.all('SELECT * FROM migrations ORDER BY id', [], (err, migrations) => {
      console.log('\n=== Applied Migrations ===');
      if (err) {
        console.error('Error getting migrations:', err.message);
      } else {
        migrations.forEach(m => {
          const date = new Date(m.applied_at * 1000).toISOString();
          console.log(`${m.id}. ${m.name} (applied at: ${date})`);
        });
      }

      // Close the database connection
      db.close();
    });
  });
});
