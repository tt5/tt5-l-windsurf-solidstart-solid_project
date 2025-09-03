#!/usr/bin/env node
import { PATHS, MIGRATIONS } from './config.js';
import Database from 'better-sqlite3';
import { access, constants } from 'node:fs/promises';

// Define available migrations with their names and SQL
// Import TypeScript migrations
import { up as userSpecificTablesUp, down as userSpecificTablesDown } from './migrations/004_user_specific_tables.js';

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
      
      -- Check if column exists before adding it
      SELECT CASE 
        WHEN NOT EXISTS (SELECT * FROM pragma_table_info('items') WHERE name = 'user_id') 
        THEN 'ALTER TABLE items ADD COLUMN user_id TEXT NOT NULL DEFAULT ''default'''
        ELSE 'SELECT ''Column user_id already exists'''
      END;
    `,
  },
  {
    name: 'add_created_at_ms_column',
    // Add created_at_ms column if it doesn't exist
    sql: `
      -- Add created_at_ms column if it doesn't exist
      SELECT CASE 
        WHEN NOT EXISTS (SELECT * FROM pragma_table_info('items') WHERE name = 'created_at_ms') 
        THEN 'ALTER TABLE items ADD COLUMN created_at_ms INTEGER'
        ELSE 'SELECT ''Column created_at_ms already exists'''
      END;
    `
  },
  {
    name: 'update_timestamps',
    // Update existing timestamps to use milliseconds
    sql: `
      -- Update existing timestamps to use milliseconds
      UPDATE items 
      SET created_at_ms = strftime('%s', created_at) * 1000 
      WHERE created_at_ms IS NULL;
    `
  },
  {
    name: 'user_specific_tables',
    isTsMigration: true,
    up: userSpecificTablesUp,
    down: userSpecificTablesDown
  },
  {
    name: 'millisecond_precision',
    // Update all tables to use millisecond precision
    sql: `
      -- Update items table
      CREATE TABLE items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
      );
      
      -- Copy existing data
      INSERT INTO items_new (id, user_id, data, created_at_ms)
      SELECT id, user_id, data, created_at_ms FROM items;
      
      -- Replace old table
      DROP TABLE items;
      ALTER TABLE items_new RENAME TO items;
      
      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_created_ms ON items(created_at_ms);
    `
  }
];

async function runMigrations() {
  // Make Database type available for TypeScript migrations
  globalThis.Database = Database;
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
            if (migration.isTsMigration) {
              // Run TypeScript migration
              await migration.up(db);
            }
            else if (migration.name === 'add_user_id_column') {
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
              // For other SQL migrations, just run the SQL
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
