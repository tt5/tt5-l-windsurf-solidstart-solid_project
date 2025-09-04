import { getDb } from '../src/lib/server/db';

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    const db = await getDb();
    
    // Check if migrations table exists
    const migrationsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
    );
    
    console.log('Migrations table exists:', !!migrationsTable);
    
    if (migrationsTable) {
      const migrations = await db.all('SELECT * FROM migrations');
      console.log('Applied migrations:', migrations);
    }
    
    // List all tables
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('All tables:', tables);
    
    // Check if base_points table exists
    const basePointsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='base_points'"
    );
    
    console.log('Base points table exists:', !!basePointsTable);
    
    if (basePointsTable) {
      const count = await db.get('SELECT COUNT(*) as count FROM base_points');
      console.log('Number of base points:', count?.count || 0);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase().catch(console.error);
