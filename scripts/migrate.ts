import { join, dirname } from 'path';
import { readdir, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { createDatabaseConnection } from './core/db';
import type { MigrationFile } from './types/database';
import { 
  ensureDataDirectory, 
  getAppliedMigrations, 
  getAllTables, 
  tableExists,
  ensureMigrationsTable,
  getTableRowCount,
  getTableSchema
} from './utils/db-utils';
import type { Database, MigrationResult, InitResult } from './types/database';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');


const getMigrationFiles = async (): Promise<string[]> => {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    return files
      .filter(file => /^\d+_.+\.(js|ts)$/.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Migrations directory not found, creating...');
      await mkdir(MIGRATIONS_DIR, { recursive: true });
      return [];
    }
    throw error;
  }
};

const loadMigration = async (file: string) => {
  const { default: migration } = await import(`../migrations/${file}`);
  if (!migration?.up) {
    throw new Error(`Invalid migration: ${file}`);
  }
  return {
    id: file.split('_')[0],
    name: file.replace(/\.(js|ts)$/, ''),
    up: migration.up,
    down: migration.down,
  };
};

const runMigrations = async (): Promise<MigrationResult> => {
  console.log('\n=== Database Migration ===');
  const startTime = Date.now();
  
  try {
    if (!(await ensureDataDirectory())) {
      throw new Error('Failed to ensure data directory');
    }
    
    console.log('\n1. Connecting to database...');
    const db = await createDatabaseConnection();
    
    try {
      console.log('\n2. Checking for migration files...');
      await mkdir(MIGRATIONS_DIR, { recursive: true });
      const migrationFiles = await getMigrationFiles();
      console.log(`   Found ${migrationFiles.length} migration files`);
      
      console.log('\n3. Checking for applied migrations...');
      await ensureMigrationsTable(db);
      const appliedMigrations = await getAppliedMigrations(db);
      console.log(`   Found ${appliedMigrations.length} applied migrations`);
      
      const pendingMigrations = migrationFiles.filter(
        file => !appliedMigrations.some(m => m.name === file.replace(/\.[^/.]+$/, ''))
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      
      if (!pendingMigrations.length) {
        console.log('✅ Database is up to date');
        return { success: true, applied: 0 };
      }
      
      console.log(`\n4. Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach((file, i) => 
        console.log(`   ${i + 1}. ${file}`)
      );
      
      console.log('\n5. Applying migrations...');
      let appliedCount = 0;
      
      for (const file of pendingMigrations) {
        console.log(`\n   🔄 Applying migration: ${file}`);
        const migration = await loadMigration(file);
        
        try {
          await db.run('BEGIN TRANSACTION');
          await migration.up(db);
          await db.run(
            "INSERT INTO migrations (name, applied_at) VALUES (?, strftime('%s', 'now'))",
            migration.name
          );
          await db.run('COMMIT');
          
          console.log(`   ✅ Applied migration: ${file}`);
          appliedCount++;
        } catch (error: any) {
          await db.run('ROLLBACK');
          console.error(`   ❌ Failed to apply migration ${file}:`, error.message);
          return {
            success: false,
            applied: appliedCount,
            error: `Migration failed: ${file} - ${error.message}`,
            pendingMigrations: pendingMigrations.slice(appliedCount)
          };
        }
      }
      
      console.log(`\n✅ Successfully applied ${appliedCount} migrations`);
      return {
        success: true,
        applied: appliedCount,
        totalMigrations: migrationFiles.length
      };
      
    } finally {
      await db.close();
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return {
      success: false,
      applied: 0,
      error: error.message || 'Unknown error during migration'
    };
    
  } finally {
    console.log(`⏱️  Migration completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  }
}

const initializeDatabase = async (): Promise<InitResult> => {
  console.log('\n=== Database Initialization ===');
  const startTime = Date.now();
  const tablesCreated: string[] = [];
  
  try {
    if (!(await ensureDataDirectory())) {
      throw new Error('Failed to ensure data directory');
    }
    
    console.log('\n1. Connecting to database...');
    
    const db = await createDatabaseConnection();
    
    try {
      console.log('\n2. Checking existing tables...');
      const tables = await getAllTables(db);
      
      if (tables.length) {
        console.log('✅ Database already initialized with tables:', tables.map(t => t.name).join(', '));
        return { success: true, tablesCreated: [] };
      }
      
      console.log('\n3. Creating tables...');
      
      // Table definitions
      const tableDefs = [
        {
          name: 'migrations',
          sql: `
            CREATE TABLE IF NOT EXISTS migrations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL UNIQUE,
              applied_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
          `
        },
        {
          name: 'users',
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              created_at INTEGER DEFAULT (strftime('%s', 'now')),
              updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
          `
        },
        {
          name: 'base_points',
          sql: `
            CREATE TABLE IF NOT EXISTS base_points (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              points INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER DEFAULT (strftime('%s', 'now')),
              updated_at INTEGER DEFAULT (strftime('%s', 'now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `
        }
      ];
      
      // Create tables in a transaction
      await db.run('BEGIN TRANSACTION');
      try {
        for (const { name, sql } of tableDefs) {
          console.log(`   - Creating ${name} table`);
          await db.exec(sql);
          tablesCreated.push(name);
        }
        await db.run('COMMIT');
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
      
      console.log(`✅ Database initialized with ${tablesCreated.length} tables`);
      return { success: true, tablesCreated };
      
    } finally {
      await db.close();
    }
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    return { 
      success: false, 
      error: error.message || 'Unknown error during initialization',
      tablesCreated: []
    };
  } finally {
    console.log(`⏱️  Initialization completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  }
}

const main = async () => {
  const command = process.argv[2]?.toLowerCase() || 'help';
  
  try {
    switch (command) {
      case 'init':
        await initializeDatabase();
        break;
      case 'migrate':
        await runMigrations();
        break;
      case 'help':
      default:
        showHelp();
        process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const showHelp = () => console.log(`
Database Management Tool

Usage:
  npx tsx scripts/migrate.ts <command>

Commands:
  init     Initialize the database with required tables
  migrate  Run pending database migrations
  help     Show this help message

Examples:
  npx tsx scripts/migrate.ts init
  npx tsx scripts/migrate.ts migrate
`);

// Execute the appropriate command when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

export {
  runMigrations,
  initializeDatabase,
  getMigrationFiles,
  loadMigration,
  type MigrationResult,
  type MigrationFile
};

export type { MigrationFunction } from './types/database';
