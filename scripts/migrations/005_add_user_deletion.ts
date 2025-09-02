import { getDb } from '../config';

export async function up() {
  const db = await getDb();
  
  // Add deleted_at column to user_tables
  await db.exec(`
    ALTER TABLE user_tables
    ADD COLUMN deleted_at_ms INTEGER;
  `);
  
  console.log('Added deleted_at_ms column to user_tables');
}

export async function down() {
  const db = await getDb();
  
  // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
  await db.exec(`
    CREATE TABLE user_tables_new (
      user_id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    
    INSERT INTO user_tables_new (user_id, table_name, created_at_ms)
    SELECT user_id, table_name, created_at_ms
    FROM user_tables
    WHERE deleted_at_ms IS NULL;
    
    DROP TABLE user_tables;
    ALTER TABLE user_tables_new RENAME TO user_tables;
  `);
  
  console.log('Removed deleted_at_ms column from user_tables');
}
