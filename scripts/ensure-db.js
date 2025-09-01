#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'app.db');

async function ensureDatabase() {
  try {
    // Create data directory if it doesn't exist
    try {
      await fs.mkdir(dataDir, { recursive: true });
      console.log(`✅ Created directory: ${dataDir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    // Check if database exists
    let dbExists;
    try {
      await fs.access(dbPath);
      dbExists = true;
      console.log(`ℹ️  Database already exists at: ${dbPath}`);
    } catch {
      dbExists = false;
    }

    // Initialize or verify the database
    const db = new Database(dbPath);
    
    try {
      // Check if table exists
      const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='items'"
      ).get();

      if (!tableExists) {
        console.log('🔄 Creating database tables...');
        db.exec(`
          CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Add initial data
        const insert = db.prepare('INSERT INTO items (data) VALUES (?)');
        const initialData = [
          ['[0, 2, 4, 6, 8]'],
        ];

        const insertMany = db.transaction((items) => {
          for (const item of items) insert.run(item);
        });

        insertMany(initialData);
        console.log('✅ Database initialized with default data');
      } else {
        console.log('✅ Database schema is up to date');
      }

      // Verify we can read data
      const rowCount = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
      console.log(`📊 Database contains ${rowCount} items`);
      
      if (rowCount > 0) {
        const sample = db.prepare('SELECT * FROM items ORDER BY created_at DESC LIMIT 1').get();
        console.log('📝 Latest item:', sample);
      }

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the function
ensureDatabase();
