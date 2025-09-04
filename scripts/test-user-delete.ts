import { getDb, deleteUser, initializeRepositories } from '../src/lib/server/db';

async function testUserDeletion() {
  try {
    console.log('Testing user deletion...');
    
    // Initialize database and repositories
    const db = await getDb();
    await initializeRepositories();
    
    const testUserId = 'test_user_123';
    
    console.log(`Deleting user: ${testUserId}`);
    const result = await deleteUser(testUserId);
    
    if (result) {
      console.log('✅ User deletion test passed!');
    } else {
      console.log('❌ User deletion test failed');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testUserDeletion();
