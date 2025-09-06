import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  name: string;
  up: (db: Database) => Promise<void>;
  down?: (db: Database) => Promise<void>;
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(__dirname, 'migrations/v2');
  const files = (await fs.readdir(migrationsDir))
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .sort();
  
  const migrations: Migration[] = [];
  
  for (const file of files) {
    try {
      const module = await import(join(migrationsDir, file));
      if (module.name && module.up) {
        migrations.push({
          name: module.name,
          up: module.up,
          down: module.down
        });
      }
    } catch (error) {
      console.error(`Error loading migration ${file}:`, error);
      throw error;
    }
  }
  
  return migrations;
}

async function ensureMigrationsTable(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
}

async function getAppliedMigrations(db: Database): Promise<Set<string>> {
  const rows = await db.all('SELECT name FROM migrations');
  return new Set(rows.map(row => row.name));
}

export async function runMigrations(dbPath: string): Promise<void> {
  console.log('Starting database migrations...');
  
  // Ensure the directory exists
  await fs.mkdir(dirname(dbPath), { recursive: true });
  
  // Open database connection
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Ensure migrations table exists
    await ensureMigrationsTable(db);
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(db);
    console.log(`Found ${appliedMigrations.size} applied migrations`);
    
    // Load all available migrations
    const migrations = await loadMigrations();
    console.log(`Found ${migrations.length} migration files`);
    
    // Filter out already applied migrations
    const pendingMigrations = migrations.filter(m => !appliedMigrations.has(m.name));
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations to apply');
      return;
    }
    
    console.log(`Applying ${pendingMigrations.length} pending migrations...`);
    
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      for (const migration of pendingMigrations) {
        console.log(`\n=== Running migration: ${migration.name} ===`);
        
        // Run the migration
        await migration.up(db);
        
        // Record the migration
        await db.run(
          'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
          [migration.name, Math.floor(Date.now() / 1000)]
        );
        
        console.log(`✅ Successfully applied migration: ${migration.name}`);
      }
      
      // Commit transaction if all migrations succeed
      await db.exec('COMMIT');
      console.log('\nAll migrations completed successfully!');
      
    } catch (error) {
      // Rollback on error
      await db.exec('ROLLBACK');
      console.error('\n❌ Migration failed:', error);
      throw error;
    }
    
  } finally {
    // Close the database connection
    await db.close();
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'app.db');
  console.log(`Using database: ${dbPath}`);
  
  runMigrations(dbPath)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
