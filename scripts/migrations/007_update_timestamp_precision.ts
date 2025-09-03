import type { Database } from 'better-sqlite3';

export const description = 'Update timestamp precision for user_user_a_items table';

export function up(db: Database) {
  // First, create a backup of the table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_user_a_items_backup AS
    SELECT * FROM user_user_a_items;
  `);
  
  // Drop the existing table
  db.exec('DROP TABLE IF EXISTS user_user_a_items;');
  
  // Recreate the table with millisecond precision
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_user_a_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  
  // Copy data back
  db.exec(`
    INSERT INTO user_user_a_items (id, user_id, data, created_at_ms)
    SELECT id, user_id, data, created_at_ms FROM user_user_a_items_backup;
  `);
  
  // Clean up
  db.exec('DROP TABLE IF EXISTS user_user_a_items_backup;');
}

export function down(db: Database) {
  // No down migration needed as we can't restore the original timestamps
}

export default { description, up, down };
