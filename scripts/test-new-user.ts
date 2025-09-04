import { getDb, ensureUserTable } from '../src/lib/server/db.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

async function testNewUser() {
  console.log('Testing new user creation...');
  console.log(`Database path: ${dbPath}`);
  
  try {
    // Create a test user ID
    const userId = `test_user_${Date.now()}`;
    console.log(`Creating new user: ${userId}`);
    
    // Initialize database and ensure user table exists
    console.log('Initializing database...');
    const db = await getDb();
    
    // Check if tables exist
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Existing tables:', tables.map(t => t.name));
    
    // Ensure user table exists
    console.log('Ensuring user table exists...');
    await ensureUserTable(userId);
    
    // Check if user was created
    const user = await db.get('SELECT * FROM user_tables WHERE user_id = ?', [userId]);
    console.log('User created:', !!user);
    
    if (user) {
      console.log('User details:', user);
    }
    
    // Check if base point was created
    console.log('Checking for base point...');
    const basePoint = await db.get(
      'SELECT * FROM base_points WHERE user_id = ?',
      [userId]
    );
    
    if (basePoint) {
      console.log(' Base point found:', basePoint);
    } else {
      console.log(' No base point found for user');
      
      // Try to create base point directly
      console.log('Attempting to create base point directly...');
      try {
        await db.run(
          'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
          [userId]
        );
        console.log(' Successfully created base point');
        
        // Verify
        const newBasePoint = await db.get('SELECT * FROM base_points WHERE user_id = ?', [userId]);
        console.log('New base point:', newBasePoint);
      } catch (error) {
        console.error(' Failed to create base point:', error);
      }
    }
    
    // Show all base points
    const allBasePoints = await db.all('SELECT * FROM base_points');
    console.log('All base points in database:', allBasePoints);
    console.log('Base points created successfully:', basePoints);
    console.log('✅ Test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testNewUser();
