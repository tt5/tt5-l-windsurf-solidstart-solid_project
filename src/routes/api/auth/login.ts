import type { APIEvent } from '@solidjs/start/server';
import { getDb, getBasePointRepository } from '~/lib/server/db';
import { generateToken } from '~/lib/server/auth/jwt';
import { serialize } from 'cookie';
import { randomBytes } from 'crypto';

function json(data: any, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

type LoginRequest = {
  username: string;
  password: string; // In a real app, verify hashed password
};

export async function POST({ request }: APIEvent) {
  try {
    console.log('[login] Received login request');
    const requestData = await request.json();
    console.log('[login] Request data:', requestData);
    
    const { username, password } = requestData as LoginRequest;
    
    if (!username || !password) {
      console.log('[login] Missing username or password');
      return json(
        { error: 'Username and password are required' }, 
        { status: 400 }
      );
    }

    console.log(`[login] Attempting to find user: ${username}`);
    const db = await getDb();
    
    // In a real app, verify password hash
    let user = await db.get<{ id: string, username: string }>(
      'SELECT id, username FROM users WHERE username = ?',
      [username]
    );
    
    console.log('[login] User lookup result:', user || 'User not found');
    
    if (!user) {
      console.log(`[login] User not found: ${username}`);
      // For development, create the user if it doesn't exist
      if (process.env.NODE_ENV !== 'production') {
        console.log('[login] Creating new user in development mode');
        const userId = `user_${randomBytes(16).toString('hex')}`;
        await db.run(
          'INSERT INTO users (id, username) VALUES (?, ?)',
          [userId, username]
        );
        console.log(`[login] Created new user: ${userId}`);
        user = { id: userId, username };
      } else {
        return json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Create base point if it doesn't exist for this user
    try {
      console.log('Getting base point repository...');
      const basePointRepo = await getBasePointRepository();
      console.log('BasePointRepository initialized, getting user base points...');
      const userBasePoints = await basePointRepo.getByUser(user.id);
      console.log(`User ${user.id} has ${userBasePoints.length} base points`);
      
      if (userBasePoints.length === 0) {
        console.log('No base points found, adding default base point...');
        await basePointRepo.add(user.id, 0, 0);
        console.log('Default base point added');
      }
    } catch (error) {
      console.error('Error initializing base points:', error);
      // Continue with login even if base point initialization fails
    }

    const token = generateToken({
      userId: user.id,
      username: user.username
    });

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
