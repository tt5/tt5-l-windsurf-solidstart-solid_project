import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  getDbConnection, 
  getAppliedMigrations, 
  getAllTables, 
  tableExists, 
  getTableRowCount,
  getTableSchema,
  executeQuery,
  ensureDataDirectory
} from './utils/db-utils';

// Command line interface type
type Command = 'verify' | 'check' | 'schema' | 'tables' | 'migrations' | 'help' | undefined;

const DB_PATH = join(process.cwd(), 'data', 'app.db');

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

async function getDetailedTableInfo(db: any, tableName: string): Promise<TableInfo> {
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
  } catch (error) {
    return {
      name: tableName,
      type: 'table',
      rowCount: -1,
      error: error.message
    };
  }
}

async function checkDatabaseConnection(db: any): Promise<CheckResult> {
  try {
    await db.get('SELECT 1 as test');
    return { success: true, message: '✅ Database connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Database connection failed: ${error.message}`,
      details: error
    };
  }
}

async function checkTables(db: any): Promise<CheckResult> {
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
  } catch (error) {
    return {
      success: false,
      message: `Failed to check tables: ${error.message}`,
      details: error
    };
  }
}

async function checkMigrations(db: any): Promise<CheckResult> {
  try {
    const migrations = await getAppliedMigrations(db);
    return {
      success: true,
      message: `Found ${migrations.length} applied migrations`,
      details: migrations
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check migrations: ${error.message}`,
      details: error
    };
  }
}

async function checkDatabase(command: Command = 'verify'): Promise<void> {
  console.log(`\n=== Database ${command.charAt(0).toUpperCase() + command.slice(1)} ===`);
  const startTime = Date.now();
  
  try {
    // 1. Ensure data directory exists
    if (command === 'verify' || command === 'check') {
      console.log('\n1. Verifying data directory...');
      await ensureDataDirectory();
      console.log('✅ Data directory verified');

      // 2. Check database file
      console.log('\n2. Checking database file...');
      try {
        const stats = await fs.stat(DB_PATH);
        console.log(`✅ Database file exists (${(stats.size / 1024).toFixed(2)} KB)`);
      } catch (error) {
        console.log('ℹ️ Database file does not exist, it will be created on first connection');
      }
    }

    // 3. Connect to database
    console.log('\n3. Connecting to database...');
    const db = await getDbConnection();
    
    try {
      const connectionCheck = await checkDatabaseConnection(db);
      console.log(connectionCheck.message);
      
      if (!connectionCheck.success) {
        throw new Error(connectionCheck.message);
      }
      
      // Execute command-specific checks
      switch (command) {
        case 'tables':
          const tablesCheck = await checkTables(db);
          console.log(`\n${tablesCheck.message}`);
          if (tablesCheck.details) {
            console.table(tablesCheck.details.map((t: TableInfo) => ({
              Name: t.name,
              'Row Count': t.rowCount,
              Status: t.error ? `❌ ${t.error}` : '✅ OK'
            })));
          }
          break;
          
        case 'migrations':
          const migrationsCheck = await checkMigrations(db);
          console.log(`\n${migrationsCheck.message}`);
          if (migrationsCheck.details?.length > 0) {
            console.log('\nLatest migrations:');
            console.table(migrationsCheck.details.slice(-5).map((m: any) => ({
              ID: m.id,
              Name: m.name,
              'Applied At': new Date(m.applied_at * 1000).toISOString()
            })));
          }
          break;
          
        case 'verify':
        case 'check':
        default:
          // Run all checks
          const [tablesResult, migrationsResult] = await Promise.all([
            checkTables(db),
            checkMigrations(db)
          ]);
          
          console.log(`\n4. ${tablesResult.message}`);
          console.log(`5. ${migrationsResult.message}`);
          
          if (tablesResult.details) {
            console.log('\nTable status:');
            console.table(tablesResult.details.map((t: TableInfo) => ({
              Name: t.name,
              'Row Count': t.rowCount,
              Status: t.error ? `❌ ${t.error}` : '✅ OK'
            })));
          }
          
          if (migrationsResult.details?.length > 0) {
            const latest = migrationsResult.details[migrationsResult.details.length - 1];
            console.log(`\nLatest migration: ${latest.name} (${new Date(latest.applied_at * 1000).toISOString()})`);
          }
          break;
      }
      
      // Display basic table info
      tableInfo.forEach(({ name, rowCount, error }) => {
        if (error) {
          console.log(`❌ ${name.padEnd(20)} Error: ${error}`);
        } else {
          console.log(`✔️  ${name.padEnd(20)} ${rowCount.toString().padStart(5)} rows`);
        }
      });

      // 8. Check for test data
      console.log('\n7. Checking for test data...');
      if (await tableExists(db, 'users')) {
        const testUsers = await executeQuery(db, "SELECT * FROM users WHERE username LIKE 'test%'");
        console.log(`   Found ${testUsers.length} test users`);
      }
      
      // 9. Display table information
      if (tables.length > 0) {
        console.log('\n📋 Database Tables:');
        console.table(tables.map(t => ({
          Name: t.name,
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Operation failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = (args.find(arg => !arg.startsWith('-')) || 'verify') as Command;

// Show help if requested
if (command === 'help' || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Execute the requested command
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

// Show help message
function showHelp() {
  console.log(`
Database Management Tool

Usage:
  npx tsx scripts/check-db.ts [command]

Commands:
  verify      Run all database checks (default)
  check       Alias for verify
  tables      List all tables and row counts
  migrations  Show applied migrations
  help        Show this help message

Examples:
  npx tsx scripts/check-db.ts verify
  npx tsx scripts/check-db.ts tables
  npx tsx scripts/check-db.ts migrations
`);
}

// Run the main function
main().catch(error => {
  console.error('\n❌ Operation failed:', error);
  process.exit(1);
});
