import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { access, mkdir } from 'node:fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

// Minimal database functions
export async function ensureDbDirectory() {
  try {
    await mkdir(path.dirname(DB_PATH), { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') throw error;
  }
}

export async function createDatabaseConnection() {
  await ensureDbDirectory();
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

// Test the connection
export async function testConnection() {
  const db = await createDatabaseConnection();
  try {
    await db.get('SELECT 1 as test');
    return true;
  } finally {
    await db.close();
  }
}

// Run a simple test
async function main() {
  try {
    console.log('Starting database test...');
    console.log('Database path:', DB_PATH);
    
    // Check if directory exists
    try {
      await access(path.dirname(DB_PATH));
      console.log('Database directory exists');
    } catch (error) {
      console.log('Database directory does not exist, will be created');
    }
    
    const success = await testConnection();
    console.log('Database test:', success ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('Database test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
}

// Run the test
main();
