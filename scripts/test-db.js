import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { access, constants, mkdir } from 'node:fs/promises';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(process.cwd(), 'data', 'app.db');

async function testDb() {
  try {
    // Check if we can access the data directory
    console.log('1. Checking data directory...');
    try {
      await access(join(process.cwd(), 'data'), constants.F_OK);
      console.log('   ✅ Data directory exists');
    } catch (err) {
      console.log('   ℹ️ Data directory does not exist, creating...');
      await mkdir(join(process.cwd(), 'data'), { recursive: true });
      console.log('   ✅ Created data directory');
    }

    // Check if database file exists
    console.log('\n2. Checking database file...');
    try {
      await access(DB_PATH, constants.F_OK | constants.R_OK | constants.W_OK);
      console.log(`   ✅ Database file exists and is readable/writable: ${DB_PATH}`);
    } catch (err) {
      console.log(`   ℹ️ Database file does not exist or is not accessible: ${DB_PATH}`);
      console.log('   ℹ️ Creating a new database file...');
    }

    // Try to open a connection
    console.log('\n3. Testing database connection...');
    try {
      const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
      });

      console.log('   ✅ Successfully connected to database');
      
      // Test a simple query
      console.log('\n4. Running test query...');
      const result = await db.get('SELECT sqlite_version() as version');
      console.log('   ✅ SQLite version:', result.version);
      
      await db.close();
      
    } catch (err) {
      console.error('   ❌ Failed to connect to database:', err.message);
      console.error('   Error details:', err);
      return;
    }

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

testDb();
