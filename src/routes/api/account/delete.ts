import { APIEvent } from "@solidjs/start/server";
import { getDb } from '~/lib/server/db';
import { jsonResponse } from '~/lib/server/utils';

export async function POST({ request }: APIEvent) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return jsonResponse({ error: 'User ID is required' }, 400);
    }

    const db = await getDb();
    
    // Remove user from user_tables
    await db.run(
      'DELETE FROM user_tables WHERE user_id = ?',
      [userId]
    );
    
    // Delete user's data (optional: you might want to keep it for a while)
    const tableName = `user_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}_items`;
    await db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return jsonResponse({ error: 'Failed to delete account' }, 500);
  }
}
