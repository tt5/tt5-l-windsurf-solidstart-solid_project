import { createDatabaseConnection } from './core/db';
import {
  ensureDataDirectory,
  getAppliedMigrations,
  getAllTables,
  tableExists,
  getTableRowCount,
  getTableSchema,
  QueryResult
} from './utils/db-utils';
import type { Database, DbMigration, TableInfo, CheckResult, TableDetails } from './types/database';

const checkDatabase = async (): Promise<CheckResult> => {
  const requiredTables = ['users', 'items', 'base_points'];
  const result: CheckResult = {
    success: false,
    dbExists: false,
    tables: [],
    migrations: [],
    missingTables: [],
    requiredTables,
    error: undefined
  };
  
  try {
    // Check if database exists and is accessible
    result.dbExists = await ensureDataDirectory();
    if (!result.dbExists) {
      result.error = 'Database file does not exist';
      return result;
    }

    // Connect to the database
    const db = await createDatabaseConnection();
    
    try {
      // Get all tables and their details
      const tables = await getAllTables(db);
      
      // Get detailed info for each table in parallel
      result.tables = await Promise.all(
        tables.map(async (table) => {
          const schema = await getTableSchema(db, table.name);
          return {
            name: table.name,
            rowCount: await getTableRowCount(db, table.name),
            schema: schema || 'N/A'
          };
        })
      );
      
      // Check for missing required tables
      result.missingTables = requiredTables.filter(
        tableName => !tables.some(table => table.name === tableName)
      );
      
      // Check for applied migrations
      if (await tableExists(db, 'migrations')) {
        result.migrations = await getAppliedMigrations(db);
      } else {
        result.missingTables.push('migrations');
      }
      
      result.success = result.missingTables.length === 0;
    } finally {
      await db.close();
    }
  } catch (error: any) {
    result.error = error.message;
  }
  
  return result;
};

const verifyDatabaseSchema = async (): Promise<{ success: boolean; error?: string }> => {
  const result = await checkDatabase();
  
  if (!result.success) {
    return { 
      success: false, 
      error: result.error || 'Database verification failed' 
    };
  }
  
  if (result.missingTables?.length) {
    return { 
      success: false, 
      error: `Missing required tables: ${result.missingTables.join(', ')}` 
    };
  }
  
  return { success: true };
};

// Command line interface
const main = async () => {
  console.log('\n🔍 Checking database status...');
  const startTime = Date.now();
  
  const result = await checkDatabase();
  
  // Display results
  console.log('\n📊 Database Status:', result.dbExists ? '✅ Exists' : '❌ Not found');
  
  if (result.tables?.length) {
    console.log('\n📋 Tables:');
    for (const table of result.tables) {
      console.log(`\n  ${table.name} (${table.rowCount} rows)`);
      console.log(`  ${'-'.repeat(40)}`);
      console.log(`  ${table.schema.replace(/\n/g, '\n  ')}`);
    }
  } else {
    console.log('\nℹ️  No tables found in the database');
  }
  
  if (result.migrations?.length) {
    console.log('\n🔄 Applied Migrations:');
    result.migrations.forEach(migration => {
      const date = new Date(migration.applied_at * 1000).toISOString();
      console.log(`  - ${migration.name} (${date})`);
    });
  } else {
    console.log('\nℹ️  No migrations have been applied');
  }
  
  if (result.missingTables?.length) {
    console.log('\n❌ Missing Tables:');
    result.missingTables.forEach(table => console.log(`  - ${table}`));
  }
  
  console.log(`\n✅ Database check completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  process.exit(result.success ? 0 : 1);
};

// Show help information
const showHelp = () => {
  console.log(`
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
  npx tsx scripts/check-db.ts verify
  npx tsx scripts/check-db.ts check
  npx tsx scripts/check-db.ts tables
  npx tsx scripts/check-db.ts schema
  npx tsx scripts/check-db.ts migrations
`);
};

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args.find(arg => !arg.startsWith('-')) || 'verify';

  // Show help if requested
  if (command === 'help' || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Run the appropriate command
  (async () => {
    try {
      switch (command) {
        case 'verify':
        case 'check':
          await main();
          break;
        case 'help':
        default:
          showHelp();
          break;
      }
    } catch (error) {
      console.error('\n❌ Operation failed:', error);
      process.exit(1);
    }
  })();
}

// Export for programmatic use
export { checkDatabase, verifyDatabaseSchema };
