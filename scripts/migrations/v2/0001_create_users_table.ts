import { Database } from 'sqlite';

export const name = '0001_create_users_table';

export async function up(db: Database): Promise<void> {
  console.log('Creating users table...');
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  console.log('Creating index on users.username...');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  
  console.log('Migration 0001_create_users_table completed successfully');
}

export async function down(db: Database): Promise<void> {
  console.log('Dropping users table...');
  await db.exec('DROP TABLE IF EXISTS users');
  console.log('Rollback of 0001_create_users_table completed');
}
