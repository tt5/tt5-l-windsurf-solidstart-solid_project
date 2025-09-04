import { randomBytes } from 'crypto';
import { setTimeout } from 'timers/promises';
import { getDbConnection } from './utils/db-utils';

export const TEST_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  DEFAULT_PASSWORD: 'testpassword',
  RETRY_DELAY: 1000, // 1 second
  MAX_RETRIES: 3,
  TEST_USER_PREFIX: 'testuser_'
};

export interface ApiResponse {
  success: boolean;
  [key: string]: any;
}

export interface TestUser {
  id: string;
  username: string;
  email?: string;
  token?: string;
}

export async function fetchWithRetry<T = any>(
  endpoint: string,
  options?: RequestInit,
  retries = TEST_CONFIG.MAX_RETRIES
): Promise<T> {
  try {
    const response = await fetch(`${TEST_CONFIG.BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error');
      throw new Error(`API request failed (${response.status}): ${error}`);
    }
    
    return response.json();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`   ⏳ Retrying... (${retries} attempts left)`);
    await setTimeout(TEST_CONFIG.RETRY_DELAY);
    return fetchWithRetry<T>(endpoint, options, retries - 1);
  }
}

export function generateTestUsername(prefix = TEST_CONFIG.TEST_USER_PREFIX): string {
  return `${prefix}${randomBytes(4).toString('hex')}`;
}

export async function createTestUser(username?: string): Promise<TestUser> {
  const user = username || generateTestUsername();
  const response = await fetchWithRetry<ApiResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ 
      username: user, 
      password: TEST_CONFIG.DEFAULT_PASSWORD 
    })
  });

  if (!response.success) {
    throw new Error(`Failed to create test user: ${response.error || 'Unknown error'}`);
  }

  return {
    id: response.user.id,
    username: response.user.username,
    token: response.token
  };
}

export async function deleteTestUser(userId: string, token?: string): Promise<boolean> {
  try {
    await fetchWithRetry(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return true;
  } catch (error) {
    console.error('Failed to delete test user:', error.message);
    return false;
  }
}

export async function withDatabase<T>(callback: (db: any) => Promise<T>): Promise<T> {
  const db = await getDbConnection();
  try {
    return await callback(db);
  } finally {
    await db.close();
  }
}

export async function clearTestData() {
  return withDatabase(async (db) => {
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM sessions');
      await db.run('DELETE FROM users');
      await db.run('DELETE FROM base_points');
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  });
}

export function logTestSection(title: string) {
  console.log(`\n=== ${title} ===`);
}

export function logTestStep(step: number, message: string) {
  console.log(`\n${step}. ${message}`);
}

export function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

export function logError(message: string, error?: Error) {
  console.error(`❌ ${message}`, error ? `\n   ${error.message}` : '');
}

export function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

export function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}
