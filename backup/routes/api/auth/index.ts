import { APIEvent, json } from 'solid-start';
import { getDb } from '~/lib/server/db';
import { getSession } from '@solid-mediakit/auth';

type AuthAction = 'login' | 'logout' | 'delete-account';

export async function POST({ request }: APIEvent) {
  const { action, username } = await request.json();
  
  switch (action as AuthAction) {
    case 'login':
      return handleLogin(username);
    case 'logout':
      return handleLogout(request);
    case 'delete-account':
      return handleDeleteAccount(request);
    default:
      return json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handleLogin(username: string) {
  if (!username) {
    return json({ error: 'Username is required' }, { status: 400 });
  }
  
  // In a real app, you would validate credentials here
  const userId = `user_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  return json({
    user: { id: userId, username },
    token: 'dummy-jwt-token' // In production, use a real JWT
  });
}

async function handleLogout(request: Request) {
  // In a real app, you would invalidate the session/token
  return json({ success: true });
}

async function handleDeleteAccount(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const db = await getDb();
    await db.run('DELETE FROM users WHERE id = ?', [session.userId]);
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
