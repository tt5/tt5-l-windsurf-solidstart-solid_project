import type { Database as DatabaseType } from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Migration: 004_user_specific_tables
// Creates a table for each user and migrates their items
export async function up(db: DatabaseType) {
  // 2. Check if items table exists
  const itemsTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='items'
  `).get() as { name: string } | undefined;
  
  if (!itemsTableExists) {
    // If no items table, just create the user_tables table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
      )
    `);
    return; // Exit early if no items table exists
  }
  
  // 3. Get all unique user_ids from items
  const users = db.prepare('SELECT DISTINCT user_id FROM items').all() as Array<{ user_id: string }>;
  
  // 4. For each user, create a dedicated table and migrate their items
  for (const row of users) {
    const user_id = String(row.user_id);
    // Create a safe table name (replace any non-alphanumeric characters with _)
    const safeUserId = user_id.replace(/[^a-zA-Z0-9_]/g, '_');
    const tableName = `user_${safeUserId}_items`;
    
    // Create the user's items table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL
      )
    `);
    
    // Insert into user_tables
    db.prepare(`
      INSERT OR IGNORE INTO user_tables (user_id, table_name)
      VALUES (?, ?)
    `).run(user_id, tableName);
    
    // Migrate user's items to their dedicated table
    db.prepare(`
      INSERT INTO ${tableName} (id, data, created_at_ms)
      SELECT id, data, created_at_ms 
      FROM items 
      WHERE user_id = ?
    `).run(user_id);
  }
  
  // 5. Create a view for backward compatibility
  if (users.length > 0) {
    const viewDefinition = users
      .map((row) => {
        const user_id = String(row.user_id);
        const safeUserId = user_id.replace(/[^a-zA-Z0-9_]/g, '_');
        const tableName = `user_${safeUserId}_items`;
        return `SELECT id, '${user_id}' as user_id, data, created_at_ms FROM ${tableName}`;
      })
      .join(' UNION ALL ');
  
    db.exec(`
      CREATE VIEW IF NOT EXISTS vw_items AS
      ${viewDefinition}
    `);
  }
}

// Rollback function - be careful as this is destructive
export async function down(db: DatabaseType) {
  // Get all user tables
  const userTables = db.prepare('SELECT table_name FROM user_tables').all() as { table_name: string }[];
  
  // Drop all user tables
  for (const { table_name } of userTables) {
    db.exec(`DROP TABLE IF EXISTS ${table_name}`);
  }
  
  // Drop the user_tables table
  db.exec('DROP TABLE IF EXISTS user_tables');
  
  // Drop the view
  db.exec('DROP VIEW IF EXISTS vw_items');
}
