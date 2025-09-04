import { randomBytes } from 'crypto';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLoginFlow() {
  const baseUrl = 'http://localhost:3000';
  const username = `testuser_${randomBytes(4).toString('hex')}`;
  const password = 'testpassword';

  console.log('Testing registration...');
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!registerResponse.ok) {
    const error = await registerResponse.text();
    throw new Error(`Registration failed: ${error}`);
  }

  const registerData = await registerResponse.json();
  console.log('✅ Registration successful:', registerData);

  console.log('\nTesting login...');
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!loginResponse.ok) {
    const error = await loginResponse.text();
    throw new Error(`Login failed: ${error}`);
  }

  const loginData = await loginResponse.json();
  console.log('✅ Login successful:', loginData);

  // Check database state
  console.log('\nChecking database state...');
  const dbPath = path.join(__dirname, '../data/app.db');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Get user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    console.log('User in database:', user);

    // Get user's base points
    const basePoints = await db.all('SELECT * FROM base_points WHERE user_id = ?', [user.id]);
    console.log('User\'s base points:', basePoints);

    // Get user's table
    const userTable = await db.get('SELECT * FROM user_tables WHERE user_id = ?', [user.id]);
    console.log('User\'s table:', userTable);

  } finally {
    await db.close();
  }
}

testLoginFlow().catch(console.error);
