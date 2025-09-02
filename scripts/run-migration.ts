#!/usr/bin/env node
import { PATHS } from './config.js';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const db = new Database(PATHS.DB);
  
  try {
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    
    // Get applied migrations
    const appliedMigrations = new Set(
      db.prepare('SELECT name FROM migrations').all().map((m: any) => m.name)
    );
    
    // Migration definitions
    const migrations = [
      {
        name: 'add_user_id_column',
        up: async (db: any) => {
          // Check if items table exists
          const tableExists = db.prepare(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='items'"
          ).get();
          
          if (!tableExists) {
            db.exec(`
              CREATE TABLE items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id TEXT NOT NULL DEFAULT 'default'
              )
            `);
          } else {
            // Check if column exists
            const hasColumn = db.prepare(
              "SELECT 1 FROM pragma_table_info('items') WHERE name = 'user_id'"
            ).get();
            
            if (!hasColumn) {
              db.exec(`ALTER TABLE items ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'`);
            }
          }
        }
      },
      {
        name: 'add_created_at_ms_column',
        up: async (db: any) => {
          // Check if column exists
          const hasColumn = db.prepare(
            "SELECT 1 FROM pragma_table_info('items') WHERE name = 'created_at_ms'"
          ).get();
          
          if (!hasColumn) {
            db.exec('ALTER TABLE items ADD COLUMN created_at_ms INTEGER');
          }
        }
      },
      {
        name: 'update_timestamps',
        up: async (db: any) => {
          // Only update timestamps for rows where created_at_ms is NULL
          db.exec(`
            UPDATE items 
            SET created_at_ms = (julianday(created_at) * 86400000)
            WHERE created_at_ms IS NULL AND created_at IS NOT NULL
          `);
        }
      },
      {
        name: 'user_specific_tables',
        up: async (db: any) => {
          // Import the migration dynamically
          const { up } = await import('./migrations/004_user_specific_tables.js');
          await up(db);
        }
      }
    ];

    // Run migrations
    for (const migration of migrations) {
      if (appliedMigrations.has(migration.name)) {
        console.log(`⏩ Migration already applied: ${migration.name}`);
        continue;
      }

      console.log(`🔄 Running migration: ${migration.name}`);
      
      try {
        await migration.up(db);
        
        // Record the migration
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
        
        console.log(`✅ Successfully applied migration: ${migration.name}`);
      } catch (error: any) {
        console.error(`❌ Failed to apply migration ${migration.name}:`, error.message);
        return false;
      }
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return false;
  } finally {
    db.close();
  }
}

// Run migrations
runMigrations().then(success => {
  process.exit(success ? 0 : 1);
});
