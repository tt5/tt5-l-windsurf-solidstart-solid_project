import { getDbConnection, getAllTables, getAppliedMigrations, tableExists } from './utils/db-utils.js';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

async function checkDatabaseFile() {
  try {
    const stats = await fs.stat(DB_PATH);
    return {
      exists: true,
      size: stats.size,
      permissions: (stats.mode & 0o777).toString(8).padStart(3, '0')
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false };
    throw error;
  }
}

async function checkDbDirect() {
  console.log('\n=== Direct Database Check ===');
  console.log(`Database path: ${DB_PATH}`);
  
  try {
    // 1. Check database file
    console.log('\n1. Checking database file...');
    const dbInfo = await checkDatabaseFile();
    
    if (!dbInfo.exists) {
      console.log('❌ Database file does not exist');
      return { success: false, error: 'Database file not found' };
    }
    
    console.log(`✅ Database file exists (${dbInfo.size} bytes)`);
    console.log(`   Permissions: ${dbInfo.permissions}`);
    
    // 2. Open and check database
    console.log('\n2. Connecting to database...');
    const db = await getDbConnection(DB_PATH);
    
    try {
      console.log('✅ Connected to database');
      
      // 3. Get all tables
      console.log('\n3. Checking database tables...');
      const tables = await getAllTables(db);
      console.log(`✅ Found ${tables.length} tables`);
      
      if (tables.length > 0) {
        console.log('\n   Tables:');
        console.table(tables.map(t => ({
          Name: t.name,
          Type: t.type,
          'Row Count': t.rowCount || 'N/A'
        })));
        
        // 4. Check migrations
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
      }
      
      return { success: true, tableCount: tables.length };
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkDbDirect()
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
