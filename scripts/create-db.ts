#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs/promises';
import Database from 'better-sqlite3';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
const dataDir = join(projectRoot, 'data');
const dbPath = join(dataDir, 'app.db');

async function ensureDirectoryExists(path: string) {
  try {
    await fs.mkdir(path, { recursive: true });
    console.log(`✅ Directory exists/created: ${path}`);
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error(`❌ Error creating directory ${path}:`, error.message);
      process.exit(1);
    }
  }
}

async function initializeDatabase() {
  try {
    // Check if database file already exists
    try {
      await fs.access(dbPath);
      console.log(`⚠️  Database already exists at: ${dbPath}`);
      return;
    } catch {
      // File doesn't exist, continue with creation
    }

    // Create data directory if it doesn't exist
    await ensureDirectoryExists(dataDir);

    // Initialize the database
    console.log(`🔄 Creating new database at: ${dbPath}`);
    const db = new Database(dbPath);

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add some initial data
    const insert = db.prepare('INSERT INTO items (data) VALUES (?)');
    const initialData = [
      '[0, 2, 4, 6, 8]',
    ];

    const insertMany = db.transaction((items: string[]) => {
      for (const item of items) insert.run(item);
    });

    insertMany(initialData);

    console.log('✅ Database created and initialized successfully');
    console.log(`   Location: ${dbPath}`);
    console.log('   Tables created: items');
    console.log('   Initial data inserted');

    db.close();
  } catch (error: any) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
