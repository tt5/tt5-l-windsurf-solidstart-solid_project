#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'app.db');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created directory: ${dataDir}`);
}

// Check if database already exists
if (fs.existsSync(dbPath)) {
  console.log(`Database already exists at: ${dbPath}`);
  process.exit(0);
}

console.log(`Creating new database at: ${dbPath}`);

// Initialize the database
const db = new Database(dbPath);

try {
  // Create tables with millisecond precision timestamp
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at_ms INTEGER DEFAULT (strftime('%s','now') * 1000 + (strftime('%f','now') - strftime('%S','now') * 1000))
    )
  `);

  // Add initial data with explicit timestamps
  const now = Date.now();
  const insert = db.prepare('INSERT INTO items (data, created_at_ms) VALUES (?, ?)');
  
  // Start a transaction
  const insertMany = db.transaction((items) => {
    for (const [data, timestamp] of items) {
      insert.run(data, timestamp);
    }
  });
  
  // Insert some initial data
  insertMany([
    ['[0, 2, 4, 6, 8]', now],
  ]);

  console.log('✅ Database created and initialized successfully');
  console.log(`   Location: ${dbPath}`);
  console.log('   Tables created: items');
  console.log('   Initial data inserted');
} catch (error) {
  console.error('❌ Failed to initialize database:', error.message);
  process.exit(1);
} finally {
  db.close();
}
