import { APIEvent } from '@solidjs/start/server';
import { getDb } from '~/lib/server/db';
import { withAuth } from '~/middleware/auth';

function json(data: any, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

type AuthAction = 'delete-account';

export const POST = withAuth(async ({ request, user }) => {
  const { action } = await request.json();
  
  switch (action as AuthAction) {
    case 'delete-account':
      return handleDeleteAccount(user.userId);
    default:
      return json({ error: 'Invalid action' }, { status: 400 });
  }
});

async function handleDeleteAccount(userId: string) {
  let db;
  try {
    db = await getDb();
    // Delete user data from all related tables
    await db.run('BEGIN');
    await db.run('DELETE FROM user_items WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM base_points WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    await db.run('COMMIT');
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    await db?.run('ROLLBACK');
    return json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
