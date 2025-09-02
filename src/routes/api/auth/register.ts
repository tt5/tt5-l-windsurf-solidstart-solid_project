import { APIEvent, json } from 'solid-start';
import { getDb } from '~/lib/server/db';
import { randomBytes } from 'crypto';

type RegisterRequest = {
  username: string;
  password: string; // In a real app, this should be hashed
};

export async function POST({ request }: APIEvent) {
  try {
    const { username, password } = (await request.json()) as RegisterRequest;
    
    if (!username || !password) {
      return json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUser) {
      return json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // In a real app, hash the password
    const userId = `user_${randomBytes(16).toString('hex')}`;
    
    await db.run(
      'INSERT INTO users (id, username) VALUES (?, ?)',
      [userId, username]
    );

    return json({ 
      user: { 
        id: userId, 
        username 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
