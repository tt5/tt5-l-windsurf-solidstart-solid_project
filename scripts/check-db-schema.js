import { getDbConnection, getAppliedMigrations, tableExists } from './utils/db-utils.js';

async function getTableInfo(db, tableName) {
  try {
    const [schema, count] = await Promise.all([
      db.get('SELECT sql FROM sqlite_master WHERE type = ? AND name = ?', ['table', tableName]),
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`)
    ]);
    
    return {
      name: tableName,
      schema: schema?.sql || 'N/A',
      rowCount: count?.count || 0
    };
  } catch (error) {
    console.error(`❌ Error fetching info for table ${tableName}:`, error.message);
    return { name: tableName, error: error.message };
  }
}

async function checkDbSchema() {
  console.log('\n=== Database Schema Check ===');
  
  try {
    const db = await getDbConnection();
    
    try {
      // Get all non-system tables
      const tables = await db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      // Get schema and row count for each table
      console.log('\n📋 Database Tables:');
      const tableInfo = [];
      
      for (const { name } of tables) {
        const info = await getTableInfo(db, name);
        tableInfo.push(info);
        
        if (!info.error) {
          console.log(`\n🔹 ${name} (${info.rowCount} rows)`);
          console.log(`   Schema: ${info.schema.split('(')[0]}(...)`);
        }
      }
      
      // Show migrations status
      console.log('\n🔄 Applied Migrations:');
      if (await tableExists(db, 'migrations')) {
        const migrations = await getAppliedMigrations(db);
        
        if (migrations.length > 0) {
          const latest = migrations[migrations.length - 1];
          console.log(`   ${migrations.length} migrations applied`);
          console.log(`   Latest: ${latest.name} (${new Date(latest.applied_at * 1000).toISOString()})`);
        } else {
          console.log('   No migrations applied');
        }
      } else {
        console.log('   Migrations table does not exist');
      }
      
      return { success: true, tableCount: tableInfo.length };
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Error checking database schema:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkDbSchema()
  .then(({ success, tableCount, error }) => {
    if (success) {
      console.log(`\n✅ Schema check completed (${tableCount} tables found)`);
      process.exit(0);
    } else {
      console.log('\n❌ Schema check failed:', error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
  });
