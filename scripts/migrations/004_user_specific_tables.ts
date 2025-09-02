import type { Database } from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Migration: 004_user_specific_tables
// Creates a table for each user and migrates their items
export function up(db: Database) {
  // Check if items table exists and has data
  const hasItemsTable = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='items'"
  ).get();
  
  if (!hasItemsTable) {
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
  // 1. Create user_tables to track user-specific tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_tables (
      user_id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  // 2. Get all unique user_ids from items
  const users = db.prepare('SELECT DISTINCT user_id FROM items').all() as { user_id: string }[];
  
  // 3. For each user, create a dedicated table and migrate their items
  for (const user of users) {
    const user_id = user.user_id;
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
    db.prepare(
      `INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)`
    ).run(user_id, tableName);
    
    // Migrate items to the new table
    db.prepare(
      `INSERT INTO ${tableName} (id, data, created_at_ms)
       SELECT id, data, created_at_ms FROM items WHERE user_id = ?`
    ).run(user_id);
  }
  
  // 4. Create indexes on the new tables
  for (const user of users) {
    const user_id = user.user_id;
    const safeUserId = user_id.replace(/[^a-zA-Z0-9_]/g, '_');
    const tableName = `user_${safeUserId}_items`;
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_${safeUserId}_created_ms 
      ON ${tableName}(created_at_ms)
    `);
  }
  
  // 5. Drop the old items table (commented out for safety)
  // db.exec('DROP TABLE IF EXISTS items');
  
  // 6. Create a view for backward compatibility
  const joinClauses = users.map((user) => {
    const user_id = user.user_id;
    const safeUserId = user_id.replace(/[^a-zA-Z0-9_]/g, '_');
    const tableName = `user_${safeUserId}_items`;
    return `
      SELECT id, '${user_id}' as user_id, data, created_at_ms
      FROM ${tableName}
    `;
  }).join(' UNION ALL ');
  
  if (users.length > 0) {
    db.exec(`
      CREATE VIEW IF NOT EXISTS vw_items AS
      ${joinClauses}
    `);
  }
}

// Rollback function - be careful as this is destructive
export function down(db: Database) {
  // Get all user tables
  const tables = db.prepare("SELECT table_name FROM user_tables").all() as { table_name: string }[];
  
  // Drop all user tables
  for (const { table_name } of tables) {
    db.exec(`DROP TABLE IF EXISTS ${table_name}`);
  }
  
  // Recreate the original items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
  
  // Drop the user_tables table and the view
  db.exec('DROP VIEW IF EXISTS vw_items');
  db.exec('DROP TABLE IF EXISTS user_tables');
}
