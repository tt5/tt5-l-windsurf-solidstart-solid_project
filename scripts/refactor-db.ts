#!/usr/bin/env node
import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the database
const DB_PATH = join(__dirname, '..', 'data', 'app.db');

async function refactorDatabase() {
  console.log('🔍 Starting database refactoring...');
  
  // Create a backup first
  const backupPath = `${DB_PATH}.backup-${Date.now()}`;
  console.log(`💾 Creating backup at: ${backupPath}`);
  
  try {
    const db = new Database(DB_PATH);
    
    // Enable WAL mode and foreign keys
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Begin transaction
    const transaction = db.transaction(() => {
      // 1. Create user_tables to track user-specific tables
      console.log('🔄 Creating user_tables...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_tables (
          user_id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL UNIQUE,
          created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);

      // 2. Get all unique user_ids from items
      console.log('🔍 Finding all users...');
      const users = db.prepare('SELECT DISTINCT user_id FROM items').all() as { user_id: string }[];
      
      if (users.length === 0) {
        console.log('ℹ️  No users found in the items table.');
        return;
      }

      console.log(`👥 Found ${users.length} users`);
      
      // 3. For each user, create a dedicated table and migrate their items
      for (const { user_id } of users) {
        const safeUserId = user_id.replace(/[^a-zA-Z0-9_]/g, '_');
        const tableName = `user_${safeUserId}_items`;
        
        console.log(`🔄 Creating table for user ${user_id}...`);
        
        // Create the user's items table
        db.exec(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            created_at_ms INTEGER NOT NULL
          )
        `);
        
        // Register the user table
        db.prepare(`
          INSERT OR IGNORE INTO user_tables (user_id, table_name)
          VALUES (?, ?)
        `).run(user_id, tableName);
        
        // Migrate user's items
        console.log(`🔄 Migrating items for user ${user_id}...`);
        db.prepare(`
          INSERT INTO ${tableName} (id, data, created_at_ms)
          SELECT id, data, created_at_ms 
          FROM items 
          WHERE user_id = ?
        `).run(user_id);
        
        console.log(`✅ Successfully migrated items for user ${user_id}`);
      }
      
      // 4. Create a view for backward compatibility
      console.log('🔄 Creating compatibility view...');
      const joinClauses = users.map(({ user_id }) => {
        const safeUserId = user_id.replace(/[^a-zA-Z0-9_]/g, '_');
        const tableName = `user_${safeUserId}_items`;
        return `
          SELECT id, '${user_id}' as user_id, data, created_at_ms
          FROM ${tableName}
        `;
      }).join(' UNION ALL ');
      
      db.exec(`
        CREATE VIEW IF NOT EXISTS vw_items AS
        ${joinClauses}
      `);
      
      console.log('✅ Database refactoring completed successfully!');
    });
    
    // Execute the transaction
    transaction.immediate();
    db.close();
    
  } catch (error) {
    console.error('❌ Error refactoring database:', error);
    console.error('Please restore from the backup if needed.');
    process.exit(1);
  }
}

// Run the refactoring
refactorDatabase().catch(console.error);
