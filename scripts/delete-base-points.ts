import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
config({ path: join(__dirname, '../.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
const USER_ID = process.env.TEST_USER_ID;

if (!AUTH_TOKEN || !USER_ID) {
  console.error('Error: TEST_AUTH_TOKEN and TEST_USER_ID must be set in .env');
  process.exit(1);
}

async function deleteAllBasePoints(): Promise<void> {
  try {
    console.log(`🗑️ Attempting to delete base points for user ${USER_ID}...`);
    
    const response = await fetch(`${BASE_URL}/api/base-points`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log('✅ Successfully deleted all base points');
    } else {
      const error = await response.text();
      console.error('❌ Failed to delete base points:', error);
    }
  } catch (error) {
    console.error('❌ Error deleting base points:', error instanceof Error ? error.message : String(error));
  }
}

// Run the cleanup
deleteAllBasePoints().catch(console.error);
