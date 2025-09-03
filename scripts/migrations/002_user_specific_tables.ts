import { Database } from 'better-sqlite3';

export const description = 'Enhance user tables with better timestamp handling and user-specific data';

export function up(db: Database) {
  // Add updated_at_ms to user_tables if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_tables_new (
      user_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      PRIMARY KEY (user_id, table_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    INSERT INTO user_tables_new (user_id, table_name, created_at_ms, updated_at_ms)
    SELECT user_id, table_name, created_at_ms, created_at_ms
    FROM user_tables;
    
    DROP TABLE user_tables;
    ALTER TABLE user_tables_new RENAME TO user_tables;
  `);

  // Add indexes for better performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_tables_created_at ON user_tables(created_at_ms);');
}

export function down(db: Database) {
  // Revert the changes if needed
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_tables_old (
      user_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL,
      PRIMARY KEY (user_id, table_name)
    );
    
    INSERT INTO user_tables_old (user_id, table_name, created_at_ms)
    SELECT user_id, table_name, created_at_ms
    FROM user_tables;
    
    DROP TABLE user_tables;
    ALTER TABLE user_tables_old RENAME TO user_tables;
  `);
}
