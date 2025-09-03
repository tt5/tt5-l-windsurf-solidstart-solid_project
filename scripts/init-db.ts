#!/usr/bin/env node
import { PATHS, SCHEMA } from './config.js';
import Database from 'better-sqlite3';
import { mkdir, access, constants } from 'node:fs/promises';

async function initDatabase() {
  try {
    // Ensure data directory exists
    await mkdir(PATHS.DATA, { recursive: true });
    
    // Check write permissions
    await access(PATHS.DATA, constants.W_OK);
    
    const db = new Database(PATHS.DB);
    
    try {
      // Enable WAL mode for better concurrency
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      
      // Create tables
      db.exec(SCHEMA.ITEMS_TABLE);
      
      // Create indexes
      for (const index of SCHEMA.INDEXES) {
        db.exec(index);
      }
      
      console.log('✅ Database initialized successfully');
      return true;
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    return false;
  }
}

// Run the initialization
initDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
