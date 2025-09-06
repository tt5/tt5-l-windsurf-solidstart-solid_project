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
      console.log('Base points count:', basePoints.length);
      if (basePoints.length > 0) {
        console.log('Sample base point:', basePoints[0]);
      }
    }
    
    console.log('Checking users table...');
    const users = await db.all("SELECT id, username, created_at FROM users");
    console.log('Users count:', users.length);
    if (users.length > 0) {
      console.log('Sample user:', users[0]);
    }
    
  } catch (error) {
    console.error('Error checking migrations:', error);
  } finally {
    process.exit(0);
  }
}

checkMigrations();
