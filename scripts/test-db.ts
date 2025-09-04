import { getDb } from '../src/lib/server/db';

async function testDb() {
  try {
    console.log('Testing database connection...');
    const db = await getDb();
    
    console.log('Database connection successful!');
    
    // Check if migrations table exists
    const migrationsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
    );
    
    console.log('Migrations table exists:', !!migrationsTable);
    
    // Check if base_points table exists
    const basePointsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='base_points'"
    );
    
    console.log('Base points table exists:', !!basePointsTable);
    
    // List all tables
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('All tables:', tables);
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDb().catch(console.error);
