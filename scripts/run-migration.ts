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
  }

  return migrations;
}

async function runMigrations() {
  try {
    console.log('🔍 Checking for pending migrations...');
    
    if (!await databaseExists()) {
      console.error('❌ Database not found. Please initialize the database first.');
      return false;
    }

    const db = createDatabaseConnection();
    
    try {
      // Configure database
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('synchronous = NORMAL');

      // Create migrations table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
        )
      `);

      // Load all migrations
      const migrations = await loadMigrations();
      const appliedMigrations = new Set(
        db.prepare('SELECT id FROM migrations').all().map((m: any) => m.id)
      );

      // Run pending migrations
      let applied = 0;
      for (const migration of migrations) {
        if (!appliedMigrations.has(migration.id)) {
          console.log(`🚀 Applying migration: ${migration.description} (${migration.id})`);
          
          // Run the migration in a transaction
          db.transaction(() => {
            migration.up(db);
            db.prepare(
              'INSERT INTO migrations (id, description) VALUES (?, ?)'
            ).run(migration.id, migration.description);
          })();
          
          applied++;
          console.log(`✅ Applied migration: ${migration.id}`);
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
