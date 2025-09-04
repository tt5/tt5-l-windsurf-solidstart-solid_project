import { getDb, ensureUserTable } from '../src/lib/server/db.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUserFlow() {
  console.log('Starting user flow test...');
  
  try {
    // Create a test user ID
    const userId = `test_user_${Date.now()}`;
    console.log(`Creating test user: ${userId}`);
    
    // Get database connection
    const db = await getDb();
    
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
      console.log('✅ Base point found:', basePoint);
    } else {
      console.log('❌ No base point found for user');
      
      // Try to create base point directly
      console.log('Attempting to create base point...');
      try {
        await db.run(
          'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
          [userId]
        );
        console.log('✅ Successfully created base point');
        
        // Verify
        const newBasePoint = await db.get('SELECT * FROM base_points WHERE user_id = ?', [userId]);
        console.log('New base point:', newBasePoint);
      } catch (error) {
        console.error('❌ Failed to create base point:', error);
      }
    }
    
    // Show all base points for this user
    const userBasePoints = await db.all(
      'SELECT * FROM base_points WHERE user_id = ?',
      [userId]
    );
    
    console.log('User base points:', userBasePoints);
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testUserFlow()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
