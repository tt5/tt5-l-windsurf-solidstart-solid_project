#!/usr/bin/env node
import { createDatabaseConnection, ensureDbDirectory, databaseExists, backupDatabase } from './utils/db-utils.js';
import { PATHS } from './utils/paths.js';
import { readFile } from 'node:fs/promises';
import path from 'path';

interface InitOptions {
  force?: boolean;
  testData?: boolean;
}

async function initDatabase(options: InitOptions = {}) {
  try {
    await ensureDbDirectory();
    
    // Check if database already exists
    const dbExists = await databaseExists();
    
    if (dbExists && !options.force) {
      console.log('⚠️  Database already exists. Use --force to overwrite or reset-db.ts to reset it.');
      return false;
    }

    // Backup existing database if it exists
    if (dbExists && options.force) {
      const backupPath = await backupDatabase();
      console.log(`✅ Backed up existing database to ${backupPath}`);
    }

    console.log('🔧 Initializing database...');
    const db = createDatabaseConnection();

    try {
      // Enable WAL mode for better concurrency
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('synchronous = NORMAL');

      // Read and execute schema
      const schema = await readFile(PATHS.SCHEMA_FILE, 'utf-8');
      db.exec(schema);

      // Add test data if requested
      if (options.testData) {
        await addTestData(db);
      }

      console.log('✅ Database initialized successfully');
      return true;
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return false;
  }
}

async function addTestData(db: Database.Database) {
  // Add test user and data here
  // This replaces the functionality from init-test-db.ts
  console.log('➕ Adding test data...');
  
  // Example test data - adjust as needed
  db.exec(`
    INSERT OR IGNORE INTO users (id, email) VALUES 
    ('test_user_1', 'test@example.com');
  `);
  
  // Add more test data as needed
}

// Parse command line arguments
const options: InitOptions = {
  force: process.argv.includes('--force') || process.argv.includes('-f'),
  testData: process.argv.includes('--test-data') || process.argv.includes('-t')
};

// Run the initialization
initDatabase(options).then(success => {
  process.exit(success ? 0 : 1);
});
