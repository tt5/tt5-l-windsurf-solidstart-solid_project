import { getDb } from '../src/lib/server/db';

async function checkMigrations() {
  try {
    console.log('Connecting to database...');
    const db = await getDb();
    
    console.log('Checking migrations table...');
    const migrations = await db.all('SELECT * FROM migrations');
    console.log('Applied migrations:', migrations);
    
    console.log('Checking tables...');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('All tables:', tables);
    
    const basePointsTable = tables.some(t => t.name === 'base_points');
    console.log('Base points table exists:', basePointsTable);
    
    if (basePointsTable) {
      const basePoints = await db.all('SELECT * FROM base_points');
      console.log('Base points:', basePoints);
    }
    
    console.log('Checking user tables...');
    const userTables = await db.all("SELECT * FROM user_tables");
    console.log('User tables:', userTables);
    
  } catch (error) {
    console.error('Error checking migrations:', error);
  } finally {
    process.exit(0);
  }
}

checkMigrations();
