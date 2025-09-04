import { join, dirname } from 'path';
import { readdir, mkdir, readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { 
  Database, 
  getDbConnection, 
  DbMigration, 
  TableInfo, 
  MigrationFile, 
  MigrationFunction 
} from './core/db';
import { 
  getAllTables, 
  getAppliedMigrations, 
  tableExists, 
  getTableRowCount, 
  ensureDataDirectory, 
  execute,
  getTableInfo
} from './utils/db-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, 'migrations');

interface MigrationResult {
  success: boolean;
  applied: number;
  initialized?: boolean;
  error?: string;
  tables?: any[];
  totalMigrations?: number;
  pendingMigrations?: string[];
}

interface InitResult {
  success: boolean;
  error?: string;
  tablesCreated: string[];
}

const ensureMigrationsTable = async (db: Database): Promise<void> => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
};

const getMigrationFiles = async (): Promise<string[]> => {
  try {
    const files = await readdir(MIGRATIONS_DIR);
    return files
      .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
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

const loadMigration = async (file: string): Promise<MigrationFile> => {
  const filePath = join(MIGRATIONS_DIR, file);
  const content = await readFile(filePath, 'utf8');
  
  // Extract the migration ID and name from the filename
  const match = file.match(/^(\d+)_([^.]+)\.(js|ts)$/);
  if (!match) {
    throw new Error(`Invalid migration filename: ${file}`);
  }
  
  const [_, id, name] = match;
  
  // Create a module-like object with the migration code
  const module = { 
    exports: {} as { up: MigrationFunction; down?: MigrationFunction } 
  };
  
  // Create a simple require function for migrations
  const require = (path: string) => {
    if (path === 'sqlite3') {
      return { Database: { prototype: {} } }; // Minimal sqlite3 mock
    }
    throw new Error(`Cannot require ${path} in migration`);
  };
  
  try {
    // Use the Function constructor to create the migration function
    const fn = new Function('module', 'exports', 'require', content);
    fn(module, module.exports, require);
    
    if (typeof module.exports.up !== 'function') {
      throw new Error('Migration must export an "up" function');
    }
    
    if (module.exports.down && typeof module.exports.down !== 'function') {
      throw new Error('If provided, "down" must be a function');
    }
    
    return { id, name, up: module.exports.up, down: module.exports.down };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error loading migration ${file}: ${message}`);
  }
};

const runMigrations = async (): Promise<MigrationResult> => {
  console.log('\n=== Database Migration ===');
  const startTime = Date.now();
  
  try {
    await ensureDataDirectory();
    console.log('\n1. Connecting to database...');
    
    const db = await getDbConnection();
    
    try {
      console.log('\n2. Current database state:');
      
      console.log('\n3. Checking for migration files...');
      await mkdir(MIGRATIONS_DIR, { recursive: true });
      const migrationFiles = await getMigrationFiles();
      console.log(`   Found ${migrationFiles.length} migration files`);
      
      console.log('\n4. Checking for applied migrations...');
      await ensureMigrationsTable(db);
      const appliedMigrations = await getAppliedMigrations(db);
      console.log(`   Found ${appliedMigrations.length} applied migrations`);
      
      const pendingMigrations = migrationFiles.filter(
        file => !appliedMigrations.some(m => m.name === file.replace(/\.[^/.]+$/, ''))
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      
      if (!pendingMigrations.length) {
        console.log('✅ Database is up to date');
        return { success: true, applied: 0, totalMigrations: migrationFiles.length };
      }
      
      console.log(`\n5. Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach((file, i) => 
        console.log(`   ${i + 1}. ${file}`)
      );
      
      console.log('\n6. Applying migrations...');
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
    await ensureDataDirectory();
    console.log('\n1. Connecting to database...');
    
    const db = await getDbConnection();
    
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
          name: 'items',
          sql: `
            CREATE TABLE IF NOT EXISTS items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              created_at INTEGER DEFAULT (strftime('%s', 'now')),
              updated_at INTEGER DEFAULT (strftime('%s', 'now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
};

const showHelp = () => console.log(`
Database Migration Tool

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
  ensureMigrationsTable,
  getMigrationFiles,
  loadMigration,
  type MigrationResult,
  type InitResult
};
