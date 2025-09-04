import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';

type Database = sqlite3.Database;
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ensureDbDirectory, createDatabaseConnection, databaseExists, backupDatabase } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

export async function ensureMigrationsTable(db: Database) {
  return new Promise<void>((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function getAppliedMigrations(db: Database): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    db.all('SELECT name FROM migrations', (err, rows: { name: string }[]) => {
      if (err) {
        // If migrations table doesn't exist yet
        if (err.message.includes('no such table')) {
          ensureMigrationsTable(db)
            .then(() => resolve(new Set()))
            .catch(reject);
        } else {
          reject(err);
        }
      } else {
        resolve(new Set(rows.map(row => row.name)));
      }
    });
  });
}

export async function getMigrationFiles(): Promise<string[]> {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    console.log('Found files in migrations directory:', files);
    const migrationFiles = files
      .filter(file => /^\d{4}_.+\.ts$/.test(file))  // Changed to match 4-digit prefix
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));  // Numeric sort
    console.log('Filtered migration files:', migrationFiles);
    return migrationFiles;
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    return [];
  }
}

export async function loadMigration(file: string): Promise<{
  id: string;
  name: string;
  up: (db: Database) => Promise<void>;
  down?: (db: Database) => Promise<void>;
}> {
  try {
    // Use dynamic import with file path
    const migrationPath = `file://${join(MIGRATIONS_DIR, file)}`;
    console.log(`Loading migration from: ${migrationPath}`);
    
    // Add a cache buster to prevent module caching
    const module = await import(`${migrationPath}?t=${Date.now()}`);
    
    if (!module.up) {
      throw new Error(`Migration ${file} is missing required 'up' function`);
    }
    
    console.log(`Successfully loaded migration: ${file}`);
    
    return {
      id: file.replace(/\.ts$/, ''),
      name: module.name || file.replace(/\.ts$/, ''),
      up: module.up,
      down: module.down
    };
  } catch (error) {
    console.error(`❌ Error loading migration ${file}:`, error);
    throw error;
  }
}

export async function runMigrations() {
  await ensureDbDirectory();
  
  if (!await databaseExists()) {
    console.error('❌ Database does not exist. Please initialize it first.');
    process.exit(1);
  }
  
  const db = await createDatabaseConnection();
  
  try {
    await ensureMigrationsTable(db);
    const appliedMigrations = await getAppliedMigrations(db);
    const migrationFiles = await getMigrationFiles();
    
    console.log(`🔍 Found ${migrationFiles.length} migration(s)`);
    
    let appliedCount = 0;
    
    for (const file of migrationFiles) {
      const migrationId = file.replace(/\.ts$/, '');
      
      if (appliedMigrations.has(migrationId)) {
        console.log(`✓ ${migrationId} (already applied)`);
        continue;
      }
      
      console.log(`\n🔄 Processing migration: ${migrationId}`);
      
      try {
        const migration = await loadMigration(file);
        
        // Run the migration
        await new Promise<void>((resolve, reject) => {
          db.run('BEGIN TRANSACTION', (beginErr) => {
            if (beginErr) return reject(beginErr);
            
            console.log(`Running migration: ${migrationId}`);
            
            // Run the migration
            migration.up(db)
              .then(() => {
                // Mark migration as applied
                db.run(
                  'INSERT INTO migrations (name) VALUES (?)',
                  [migrationId],
                  (insertErr) => {
                    if (insertErr) {
                      console.error('Error inserting migration record:', insertErr);
                      return db.run('ROLLBACK', () => reject(insertErr));
                    }
                    
                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        console.error('Error committing transaction:', commitErr);
                        return db.run('ROLLBACK', () => reject(commitErr));
                      }
                      
                      console.log(`✅ Successfully applied migration: ${migrationId}`);
                      resolve();
                    });
                  }
                );
              })
              .catch((error) => {
                console.error(`Error running migration ${migrationId}:`, error);
                db.run('ROLLBACK', () => reject(error));
              });
          });
        });
      } catch (error) {
        console.error(`❌ Failed to process migration ${migrationId}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ Applied ${migrationFiles.length} migration(s)`);
    
  } finally {
    if (db && typeof db.close === 'function') {
      db.close();
    }
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

export default {
  runMigrations,
  ensureMigrationsTable,
  getAppliedMigrations,
  getMigrationFiles,
  loadMigration
};
