import { randomBytes } from 'crypto';

async function testAuthFlow() {
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
  const dbCheck = await fetch(`${baseUrl}/api/check-db`);
  if (dbCheck.ok) {
    const dbState = await dbCheck.json();
    console.log('Database state:', JSON.stringify(dbState, null, 2));
  } else {
    console.error('Failed to check database state');
  }
}

testAuthFlow().catch(console.error);
