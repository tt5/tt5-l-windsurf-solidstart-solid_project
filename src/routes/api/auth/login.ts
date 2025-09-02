import { APIEvent, json } from 'solid-start';
import { getDb } from '~/lib/server/db';
import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';

type LoginRequest = {
  username: string;
  password: string; // In a real app, verify hashed password
};

export async function POST({ request }: APIEvent) {
  try {
    const { username, password } = (await request.json()) as LoginRequest;
    
    if (!username || !password) {
      return json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // In a real app, verify password hash
    const user = await db.get(
      'SELECT id, username FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // In a real app, use a proper JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    const cookie = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return json(
      { 
        user: { 
          id: user.id, 
          username: user.username 
        } 
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': cookie
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}
