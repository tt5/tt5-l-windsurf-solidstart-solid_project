import { APIEvent } from '@solidjs/start/server';
import { getDb } from '~/lib/server/db';
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
    const tableName = `user_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}_items`;
    
    // Start a transaction to ensure both operations succeed or fail together
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Insert the new user
      await db.run(
        'INSERT INTO users (id, username) VALUES (?, ?)',
        [userId, username]
      );
      
      // Create the user's items table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL,
          created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);
      
      // Add user to user_tables
      await db.run(
        'INSERT INTO user_tables (user_id, table_name) VALUES (?, ?)',
        [userId, tableName]
      );
      
      // Commit the transaction
      await db.exec('COMMIT');
      
      return json({ 
        user: { 
          id: userId, 
          username,
          tableName
        } 
      }, { status: 201 });
      
    } catch (error) {
      // Rollback the transaction on error
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
