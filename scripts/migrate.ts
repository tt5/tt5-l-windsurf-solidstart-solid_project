import { join, dirname } from 'path';
import { readdir, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { 
  getDbConnection, 
  getAllTables, 
  getAppliedMigrations,
  tableExists,
  getTableRowCount,
  executeQuery
} from './utils/db-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, 'migrations');
const DB_PATH = join(process.cwd(), 'data', 'app.db');

interface MigrationResult {
  success: boolean;
  applied: number;
  initialized?: boolean;
  error?: string;
  tables?: any[];
  totalMigrations?: number;
}

interface InitResult {
  success: boolean;
  error?: string;
  tablesCreated: string[];
}

async function ensureMigrationsTable(db: any): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
}

async function ensureDataDirectory(): Promise<void> {
  try {
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create data directory: ${error.message}`);
  }
}

async function initializeDatabase(): Promise<InitResult> {
  const startTime = Date.now();
  console.log('\n=== Database Initialization ===');
  
  try {
    await ensureDataDirectory();
    const db = await getDbConnection();
    const tablesCreated: string[] = [];

    try {
      // Enable foreign keys
      await db.exec('PRAGMA foreign_keys = ON;');
      
      // Create migrations table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
      `);
      tablesCreated.push('migrations');

      // Create users table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
      `);
      tablesCreated.push('users');

      // Create sessions table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      tablesCreated.push('sessions');

      // Create base_points table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS base_points (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      tablesCreated.push('base_points');

      console.log(`✅ Database initialized with ${tablesCreated.length} tables`);
      return { success: true, tablesCreated };
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { success: false, error: error.message, tablesCreated: [] };
  } finally {
    console.log(`⏱️  Initialization completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  }
}

async function runMigrations(): Promise<MigrationResult> {
  console.log('\n=== Database Migration ===');
  const startTime = Date.now();
  
  try {
    // 1. Ensure data directory exists
    await ensureDataDirectory();
    
    // 2. Initialize database connection
    console.log('\n1. Connecting to database...');
    const db = await getDbConnection();
    
    try {
      // 2. Show current state before migration
      console.log('\n2. Current database state:');
      
      // Get existing migrations
      await ensureMigrationsTable(db);
      const currentMigrations = await getAppliedMigrations(db);
      console.log(`   • Found ${currentMigrations.length} existing migrations`);
      
      if (currentMigrations.length > 0) {
        const latest = currentMigrations[currentMigrations.length - 1];
        console.log(`   • Latest migration: ${latest.name} (${new Date(latest.applied_at * 1000).toISOString()})`);
      }
      
      // Get current tables
      const tables = await getAllTables(db);
      console.log(`   • Found ${tables.length} tables`);
      
      // 3. Find and run new migrations
      const migrationFiles = (await readdir(MIGRATIONS_DIR))
        .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'template.ts')
        .sort();
      
      if (migrationFiles.length === 0) {
        console.log('\nℹ️  No migration files found');
        return { success: true, applied: 0, tables, totalMigrations: currentMigrations.length };
      }
      
      const appliedMigrations = new Set(
        currentMigrations.map((m: any) => m.name)
      );
      
      const pendingMigrations = migrationFiles.filter(f => !appliedMigrations.has(f));
      
      if (pendingMigrations.length === 0) {
        console.log(`\n✅ All ${migrationFiles.length} migrations already applied`);
        return { success: true, applied: 0, tables, totalMigrations: currentMigrations.length };
      }
      
      console.log(`\n3. Found ${pendingMigrations.length} new migrations to apply`);
      
      // 4. Run migrations in transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        for (const file of pendingMigrations) {
          const startTime = Date.now();
          console.log(`\n   🔄 Applying: ${file}`);
          
          // Import and run migration
          const migration = await import(join(MIGRATIONS_DIR, file));
          await migration.up(db);
          
          // Record migration
          await db.run('INSERT INTO migrations (name) VALUES (?)', [file]);
          
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`   ✅ Applied in ${duration}s`);
        }
        
        await db.run('COMMIT');
        
        // 5. Show updated state
        console.log('\n4. Updated database state:');
        
        const updatedTables = await getAllTables(db);
        console.log(`   • Found ${updatedTables.length} tables`);
        
        if (updatedTables.length > 0) {
          console.log('\n   Tables:');
          console.table(updatedTables.map(t => ({
            Name: t.name,
            Type: t.type,
            'Row Count': t.rowCount >= 0 ? t.rowCount : 'N/A'
          })));
        }
        
        const updatedMigrations = await getAppliedMigrations(db);
        console.log(`\n✅ Successfully applied ${pendingMigrations.length} migrations`);
        console.log(`   • Total migrations: ${updatedMigrations.length}`);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✨ Migration completed in ${duration}s`);
        
        return { 
          success: true, 
          applied: pendingMigrations.length, 
          tables: updatedTables,
          totalMigrations: updatedMigrations.length
        };
        
      } catch (error) {
        await db.run('ROLLBACK');
        console.error('\n❌ Migration failed, rolling back changes...');
        throw error;
      }
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    return { 
      success: false, 
      applied: 0, 
      error: error.message,
      tables: []
    };
  }
}

// Main function to handle CLI commands
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'init':
      const { success: initSuccess, error: initError, tablesCreated } = await initializeDatabase();
      if (initSuccess) {
        console.log('\n✅ Database initialized successfully');
        if (tablesCreated.length > 0) {
          console.log('\nCreated tables:', tablesCreated.join(', '));
        }
      } else {
        console.error('\n❌ Database initialization failed:', initError);
        process.exit(1);
      }
      break;
      
    case 'migrate':
    case undefined:
      const { success, applied, tables, totalMigrations, error } = await runMigrations();
      if (success) {
        console.log(`\n✅ Migration completed. Applied ${applied} of ${totalMigrations} migrations`);
        if (tables && tables.length > 0) {
          console.log('\n📊 Database tables:');
          console.table(tables);
        }
      } else {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
      }
      break;
      
    case 'help':
    default:
      console.log(`
Database Migration Tool

Usage:
  npx tsx scripts/migrate.ts [command]

Commands:
  init      Initialize database with required tables
  migrate   Run database migrations (default)
  help      Show this help message

Options:
  --force   Force migration even if database is not empty
`);
      break;
  }
}

// Execute the appropriate command
main().catch(error => {
  console.error('\n❌ An error occurred:', error);
  process.exit(1);
});
