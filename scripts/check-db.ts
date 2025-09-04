import { join } from 'path';
import { getDbConnection, closeDbConnection } from './core/db';
import { 
  getAppliedMigrations, 
  getAllTables, 
  getTableRowCount,
  getTableSchema,
  executeQuery,
  ensureDataDirectory
} from './utils/db-utils';

type Command = 'verify' | 'check' | 'schema' | 'tables' | 'migrations' | 'help' | undefined;

interface TableInfo {
  name: string;
  type: string;
  rowCount: number;
  schema?: string;
  error?: string;
}

interface CheckResult {
  success: boolean;
  message: string;
  details?: any;
}

const getDetailedTableInfo = async (db: any, tableName: string): Promise<TableInfo> => {
  try {
    const [schema, count] = await Promise.all([
      getTableSchema(db, tableName),
      getTableRowCount(db, tableName)
    ]);
    
    return {
      name: tableName,
      type: 'table',
      rowCount: count,
      schema: schema?.sql || 'N/A'
    };
  } catch (error: any) {
    return {
      name: tableName,
      type: 'table',
      rowCount: -1,
      error: error.message
    };
  }
};

const checkDatabaseConnection = async (db: any): Promise<CheckResult> => {
  try {
    await db.get('SELECT 1 as test');
    return { success: true, message: '✅ Database connection successful' };
  } catch (error: any) {
    return { 
      success: false, 
      message: `❌ Database connection failed: ${error.message}`,
      details: error
    };
  }
};

const checkTables = async (db: any): Promise<CheckResult> => {
  try {
    const tables = await getAllTables(db);
    const tableInfo = await Promise.all(
      tables.map(table => getDetailedTableInfo(db, table.name))
    );
    
    return {
      success: true,
      message: `Found ${tables.length} tables`,
      details: tableInfo
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to check tables: ${error.message}`,
      details: error
    };
  }
};

const checkMigrations = async (db: any): Promise<CheckResult> => {
  try {
    const migrations = await getAppliedMigrations(db);
    return {
      success: true,
      message: `Found ${migrations.length} applied migrations`,
      details: migrations
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to check migrations: ${error.message}`,
      details: error
    };
  }
}

const checkDatabase = async (command: Command = 'verify'): Promise<void> => {
  console.log(`\n=== Database ${command.charAt(0).toUpperCase() + command.slice(1)} ===`);
  const startTime = Date.now();
  let db;
  
  try {
    await ensureDataDirectory();
    console.log('\n1. Connecting to database...');
    
    db = await getDbConnection();
    let result: CheckResult;
    
    switch (command) {
      case 'verify':
        result = await checkDatabaseConnection(db);
        console.log(`\n${result.message}`);
        
        if (result.success) {
          const tablesResult = await checkTables(db);
          console.log(`\n${tablesResult.message}`);
          
          const migrationsResult = await checkMigrations(db);
          console.log(`\n${migrationsResult.message}`);
          
          if (tablesResult.details) {
            console.log('\nTables:');
            (tablesResult.details as TableInfo[]).forEach(table => {
              console.log(`- ${table.name}: ${table.rowCount} rows`);
            });
          }
        }
        break;
        
      case 'check':
        result = await checkDatabaseConnection(db);
        console.log(`\n${result.message}`);
        break;
        
      case 'tables':
        result = await checkTables(db);
        console.log(`\n${result.message}`);
        
        if (result.details) {
          console.log('\nTables:');
          (result.details as TableInfo[]).forEach(table => {
            console.log(`- ${table.name}: ${table.rowCount} rows`);
            if (table.error) {
              console.log(`  Error: ${table.error}`);
            }
          });
        }
        break;
        
      case 'migrations':
        result = await checkMigrations(db);
        console.log(`\n${result.message}`);
        
        if (result.details) {
          console.log('\nMigrations:');
          (result.details as any[]).forEach(migration => {
            console.log(`- ${migration.name} (applied at: ${new Date(migration.applied_at * 1000).toISOString()})`);
          });
        }
        break;
        
      case 'schema':
        result = await checkTables(db);
        console.log(`\n${result.message}`);
        
        if (result.details) {
          console.log('\nTable Schemas:');
          for (const table of result.details as TableInfo[]) {
            console.log(`\n=== ${table.name} ===`);
            console.log(table.schema || 'No schema found');
          }
        }
        break;
        
      case 'help':
      default:
        showHelp();
        return;
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (db) await closeDbConnection(db);
    console.log(`\n⏱️  Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  }
};

async function initializeDatabase() {
  console.log('\n=== Database Initialization ===');
  const db = await getDbConnection();
  
  try {
    // Create users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    console.log('✅ Users table created/verified');
    
    // Create sessions table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Sessions table created/verified');
    
    // Create migrations table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    console.log('✅ Migrations table created/verified');
    
  } finally {
    await db.close();
  }
}

const showHelp = () => console.log(`
Database Check Utility

Usage:
  npx tsx scripts/check-db.ts [command]

Commands:
  verify    Check database connection, tables and migrations (default)
  check     Check database connection only
  tables    List all tables with row counts
  schema    Show schema for all tables
  migrations List all applied migrations
  help      Show this help message

Examples:
  npx tsx scripts/check-db.ts
  npx tsx scripts/check-db.ts tables
  npx tsx scripts/check-db.ts schema
`);

// Parse command line arguments
const args = process.argv.slice(2);
const command = (args.find(arg => !arg.startsWith('-')) || 'verify') as Command;

// Show help if requested
if (command === 'help' || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the main function
async function main() {
  switch (command) {
    case 'verify':
    case 'check':
      await checkDatabase(command);
      break;
    case 'init':
      await initializeDatabase();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

main().catch(error => {
  console.error('\n❌ Operation failed:', error);
  process.exit(1);
});
