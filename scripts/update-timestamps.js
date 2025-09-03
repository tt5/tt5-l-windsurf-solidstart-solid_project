import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import { PATHS } from './utils/paths.js';

async function updateTimestamps() {
  try {
    console.log('🔧 Updating timestamp precision...');
    
    const db = new Database(PATHS.DB);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Begin transaction
    const transaction = db.transaction(() => {
      // Create a backup of the table
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
      
      console.log('✅ Timestamp precision updated successfully!');
    });
    
    // Execute transaction
    transaction();
    db.close();
    
  } catch (error) {
    console.error('❌ Error updating timestamp precision:', error);
    process.exit(1);
  }
}

// Run the update if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateTimestamps();
}

export default updateTimestamps;
