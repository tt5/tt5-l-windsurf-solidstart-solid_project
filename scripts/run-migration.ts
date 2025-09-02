#!/usr/bin/env node
import { PATHS, MIGRATIONS } from './config.js';
import Database from 'better-sqlite3';
import { access, constants } from 'node:fs/promises';

// Define available migrations with their names and SQL
const MIGRATION_SCRIPTS = [
  {
    name: 'add_user_id_column',
    // Check if column exists before adding it
    sql: `
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Only add user_id if it doesn't exist
      SELECT CASE 
        WHEN NOT EXISTS (SELECT * FROM pragma_table_info('items') WHERE name = 'user_id')
        THEN 1
        ELSE 0
      END as should_add_column;
      
      -- This will only execute if the column doesn't exist
      ALTER TABLE items ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default';
    `,
  },
  {
    name: 'add_created_at_ms_column',
    // Check if column exists before adding it
    sql: `
      SELECT CASE 
        WHEN NOT EXISTS (SELECT * FROM pragma_table_info('items') WHERE name = 'created_at_ms')
        THEN 1
        ELSE 0
      END as should_add_column;
      
      -- This will only execute if the column doesn't exist
      ALTER TABLE items ADD COLUMN created_at_ms INTEGER;
    `,
  },
  {
    name: 'update_timestamps',
    // Only update timestamps for rows where created_at_ms is NULL
    sql: `
      UPDATE items 
      SET created_at_ms = (julianday(created_at) * 86400000)
      WHERE created_at_ms IS NULL AND created_at IS NOT NULL;
    `,
  },
];

async function runMigrations() {
  try {
    // Check if database exists
    try {
      await access(PATHS.DB, constants.R_OK | constants.W_OK);
    } catch (error) {
      console.error(`❌ Database not found at ${PATHS.DB}`);
      return false;
    }

    const db = new Database(PATHS.DB);
    
    try {
      // Enable foreign keys and WAL mode
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      
      // Create migrations table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get applied migrations
      const appliedMigrations = new Set(
        db.prepare('SELECT name FROM _migrations').all().map((m: any) => m.name)
      );

      let success = true;
      
      // Run pending migrations
      for (const migration of MIGRATION_SCRIPTS) {
        if (!appliedMigrations.has(migration.name)) {
          console.log(`🔄 Running migration: ${migration.name}`);
          
          try {
            // Handle each migration type specifically
            if (migration.name === 'add_user_id_column') {
              // Check if column exists
              const hasColumn = db.prepare(
                "SELECT 1 FROM pragma_table_info('items') WHERE name = 'user_id'"
              ).get();
              
              if (!hasColumn) {
                db.exec(`ALTER TABLE items ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'`);
              }
            } 
            else if (migration.name === 'add_created_at_ms_column') {
              // Check if column exists
              const hasColumn = db.prepare(
                "SELECT 1 FROM pragma_table_info('items') WHERE name = 'created_at_ms'"
              ).get();
              
              if (!hasColumn) {
                db.exec('ALTER TABLE items ADD COLUMN created_at_ms INTEGER');
              }
            } 
            else {
              // For other migrations, just run the SQL
              db.exec(migration.sql);
            }
            
            // Record successful migration
            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
            console.log(`✅ Successfully applied migration: ${migration.name}`);
            
          } catch (error) {
            console.error(`❌ Failed to apply migration ${migration.name}:`, error.message);
            success = false;
            break;
          }
        } else {
          console.log(`⏩ Migration already applied: ${migration.name}`);
        }
      }
      
      return success;
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

// Run migrations
runMigrations().then(success => {
  process.exit(success ? 0 : 1);
});
