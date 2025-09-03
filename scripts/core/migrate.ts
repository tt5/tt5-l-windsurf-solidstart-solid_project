import { Database } from 'better-sqlite3';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ensureDbDirectory, createDatabaseConnection, databaseExists, backupDatabase } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

export async function ensureMigrationsTable(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
    )
  `);
}

export async function getAppliedMigrations(db: Database): Promise<Set<string>> {
  try {
    const rows = db.prepare('SELECT id FROM migrations').all() as { id: string }[];
    return new Set(rows.map(row => row.id));
  } catch (error) {
    // If migrations table doesn't exist yet
    if (error instanceof Error && error.message.includes('no such table')) {
      await ensureMigrationsTable(db);
      return new Set();
    }
    throw error;
  }
}

export async function getMigrationFiles(): Promise<string[]> {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    return files
      .filter(file => /^\d{3}_.+\.ts$/.test(file))
      .sort();
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    return [];
  }
}

export async function loadMigration(file: string): Promise<{
  id: string;
  description: string;
  up: (db: Database) => void;
  down?: (db: Database) => void;
}> {
  const migrationPath = `file://${join(MIGRATIONS_DIR, file)}`;
  const module = await import(migrationPath);
  
  return {
    id: file.replace(/\.ts$/, ''),
    description: module.description || 'No description',
    up: module.up,
    down: module.down
  };
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
      
      try {
        const migration = await loadMigration(file);
        
        // Backup before applying migration
        const backupPath = await backupDatabase();
        console.log(`💾 Created backup: ${backupPath}`);
        
        // Apply migration
        console.log(`🔄 Applying migration: ${migrationId} - ${migration.description}`);
        
        const transaction = db.transaction(() => {
          migration.up(db);
          
          // Record the migration
          db.prepare(
            'INSERT INTO migrations (id, description) VALUES (?, ?)'
          ).run(migrationId, migration.description);
        });
        
        transaction();
        
        console.log(`✅ Applied migration: ${migrationId}`);
        appliedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to apply migration ${migrationId}:`, error);
        process.exit(1);
      }
    }
    
    if (appliedCount === 0) {
      console.log('✅ Database is up to date');
    } else {
      console.log(`✅ Applied ${appliedCount} migration(s)`);
    }
    
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
