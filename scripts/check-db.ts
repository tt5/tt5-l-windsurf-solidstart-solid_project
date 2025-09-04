import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  getDbConnection, 
  getAppliedMigrations, 
  getAllTables, 
  tableExists, 
  getTableRowCount,
  getTableSchema,
  executeQuery
} from './utils/db-utils';

const DB_PATH = join(process.cwd(), 'data', 'app.db');

interface TableInfo {
  name: string;
  type: string;
  rowCount: number;
  schema?: string;
  error?: string;
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

async function checkDatabase(detailed: boolean = false) {
  console.log('\n=== Database Health Check ===');
  const startTime = Date.now();
  
  try {
    // 1. Ensure data directory exists
    console.log('\n1. Verifying data directory...');
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    console.log('✅ Data directory verified');

    // 2. Check database file
    console.log('\n2. Checking database file...');
    try {
      const stats = await fs.stat(DB_PATH);
      console.log(`✅ Database file exists (${(stats.size / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.log('ℹ️ Database file does not exist, it will be created on first connection');
    }

    // 3. Connect to database
    console.log('\n3. Connecting to database...');
    const db = await getDbConnection();
    
    try {
      console.log('✅ Connected to database');
      
      // 4. Check migrations
      console.log('\n4. Checking migrations...');
      const migrations = await getAppliedMigrations(db);
      console.log(`Found ${migrations.length} applied migrations`);
      
      if (migrations.length > 0) {
        console.log(`Latest migration: ${migrations[migrations.length - 1].name}`);
      } else {
        console.log('⚠️  Migrations table does not exist');
      }
      
      // 5. Verify and list all tables
      console.log('\n5. Verifying database structure...');
      const tables = await getAllTables(db);
      console.log(`Found ${tables.length} tables`);
      
      // 6. Verify required tables exist
      const requiredTables = ['users', 'sessions', 'migrations'];
      for (const table of requiredTables) {
        const exists = await tableExists(db, table);
        console.log(`   ${exists ? '✅' : '❌'} ${table} ${exists ? 'exists' : 'MISSING'}`);
      }

      // 7. Get row counts for each table
      console.log('\n6. Table row counts:');
      const tableInfo = await Promise.all(
        tables.map(table => getDetailedTableInfo(db, table.name))
      );
      
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
          Type: t.type,
          'Row Count': t.rowCount >= 0 ? t.rowCount : 'N/A',
          'Has Schema': detailed ? '✅' : 'ℹ️  (use --detailed for schema)'
        })));
        
        // Show detailed schema if requested
        if (detailed) {
          console.log('\n📜 Table Schemas:');
          for (const table of tableInfo) {
            console.log(`\n🔹 ${table.name} (${table.rowCount} rows)`);
            if (table.error) {
              console.log(`   ❌ Error: ${table.error}`);
            } else if (table.schema) {
              console.log(`   ${table.schema}`);
            }
          }
        }
      }
      
      // 6. Check specific tables
      const importantTables = ['users', 'sessions', 'base_points'];
      console.log('\n4. Checking important tables...');
      
      for (const table of importantTables) {
        const exists = await tableExists(db, table);
        if (exists) {
          const count = await getTableRowCount(db, table);
          console.log(`   • ${table.padEnd(12)}: ${count.toString().padStart(4)} rows`);
        } else {
          console.log(`   • ${table.padEnd(12)}: ❌ Does not exist`);
        }
      }
      
      // 7. Database integrity check
      console.log('\n5. Running integrity check...');
      try {
        const integrity = await db.get('PRAGMA integrity_check');
        console.log(`   • Integrity: ${integrity.integrity_check === 'ok' ? '✅' : '❌'}`);
      } catch (error) {
        console.log('   • Integrity check not supported');
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Database check completed in ${duration}s`);
      
      return { 
        success: true, 
        tableCount: tables.length,
        migrationCount: migrations.length,
        duration: parseFloat(duration)
      };
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    return { 
      success: false, 
      error: error.message,
      duration: ((Date.now() - startTime) / 1000).toFixed(2)
    };
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const detailed = args.includes('--detailed') || args.includes('-d');
const command = args.find(arg => !arg.startsWith('-'));

async function main() {
  switch (command) {
    case 'verify':
    case undefined:
      await checkDatabase(detailed);
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
Database Management Commands:
  check-db [command] [options]

Commands:
  verify    Verify database integrity (default)
  init      Initialize database structure
  help      Show this help message

Options:
  --detailed, -d  Show detailed information
  `);
}

// Run the main function
main().catch(error => {
  console.error('\n❌ Operation failed:', error);
  process.exit(1);
});
