import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDb() {
  const dbPath = path.join(__dirname, '../data/app.db');
  console.log(`Opening database at: ${dbPath}`);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Check if users table exists
    const usersTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );
    console.log('Users table exists:', !!usersTable);

    // Check if user_tables table exists
    const userTablesTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_tables'"
    );
    console.log('User tables table exists:', !!userTablesTable);

    // Check if base_points table exists
    const basePointsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='base_points'"
    );
    console.log('Base points table exists:', !!basePointsTable);

    // Check migrations table
    const migrations = await db.all('SELECT * FROM migrations');
    console.log('Applied migrations:', migrations.map(m => m.name).join(', '));

    // Count users
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    console.log('Number of users:', userCount.count);

    // Count user_tables
    const userTablesCount = await db.get('SELECT COUNT(*) as count FROM user_tables');
    console.log('Number of user tables:', userTablesCount.count);

    // Count base_points
    const basePointsCount = await db.get('SELECT COUNT(*) as count FROM base_points');
    console.log('Number of base points:', basePointsCount.count);

  } catch (error) {
    console.error('Error testing database:', error);
  } finally {
    await db.close();
  }
}

testDb().catch(console.error);
