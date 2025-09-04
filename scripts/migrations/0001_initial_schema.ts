import { Database } from 'sqlite';

export const name = '0001_initial_schema';

export async function up(db: Database): Promise<void> {
  console.log('Creating migrations table...');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log('Creating user_tables table...');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_tables (
      user_id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      deleted_at_ms INTEGER
    )
  `);

  console.log('Creating indexes...');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_table_name ON user_tables(table_name)');
  
  console.log('Marking migration as applied...');
  try {
    await db.run('INSERT INTO migrations (name) VALUES (?)', name);
    console.log('Migration 0001_initial_schema completed successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      console.log('Migration already applied, skipping...');
    } else {
      throw error;
    }
  }
}

export async function down(db: Database): Promise<void> {
  console.log('Dropping indexes...');
  await db.exec('DROP INDEX IF EXISTS idx_user_tables_table_name');
  await db.exec('DROP INDEX IF EXISTS idx_user_tables_user_id');
  
  console.log('Dropping user_tables...');
  await db.exec('DROP TABLE IF EXISTS user_tables');
  
  console.log('Removing migration record...');
  await db.run('DELETE FROM migrations WHERE name = ?', name);
  console.log('Rollback of 0001_initial_schema completed');
}
