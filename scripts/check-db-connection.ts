import { getDbConnection, getAllTables, getAppliedMigrations, tableExists } from './utils/db-utils';

async function checkDbConnection() {
  console.log('\n=== Database Connection Check ===');
  
  try {
    // 1. Test connection
    console.log('\n1. Connecting to database...');
    const db = await getDbConnection();
    console.log('✅ Database connection successful');
    
    try {
      // 2. Get tables
      console.log('\n2. Checking database tables...');
      const tables = await getAllTables(db);
      console.log(`✅ Found ${tables.length} tables`);
      
      if (tables.length > 0) {
        console.log('\n   Tables:');
        console.table(tables.map(t => ({
          Name: t.name,
          Type: t.type,
          'Row Count': t.rowCount || 'N/A'
        })));
      }
      
      // 3. Check migrations
      if (await tableExists(db, 'migrations')) {
        const migrations = await getAppliedMigrations(db);
        console.log(`\n✅ Found ${migrations.length} applied migrations`);
        
        if (migrations.length > 0) {
          const latest = migrations[migrations.length - 1];
          console.log(`   Latest migration: ${latest.name} (${new Date(latest.applied_at * 1000).toISOString()})`);
        }
      } else {
        console.log('\n⚠️  Migrations table does not exist');
      }
      
      return { success: true, tableCount: tables.length };
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Error checking database connection:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkDbConnection()
  .then(({ success, tableCount, error }) => {
    if (success) {
      console.log(`\n✅ Database check completed (${tableCount} tables found)`);
      process.exit(0);
    } else {
      console.log('\n❌ Database check failed:', error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
  });
