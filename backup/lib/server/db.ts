import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { assertServer } from './utils';
import { UserItemRepository } from './repositories/user-item.repository';
import { BasePointRepository } from './repositories/base-point.repository';

export type SqliteDatabase = Database<sqlite3.Database, sqlite3.Statement>;

const dbPath = join(process.cwd(), 'data', 'app.db');

// Initialize database
let db: SqliteDatabase;
let userItemRepo: UserItemRepository | null = null;
let basePointRepo: BasePointRepository | null = null;

async function getDb(): Promise<SqliteDatabase> {
  assertServer();
  
  if (!db) {
    console.log('Initializing database...');
    
    try {
      // Ensure data directory exists
      await fs.mkdir(dirname(dbPath), { recursive: true });
      
      // Check if database file exists
      const dbExists = await fs.access(dbPath).then(() => true).catch(() => false);
      
      // Initialize SQLite database
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
      });
      
      // Set pragmas using exec
      await db.exec('PRAGMA journal_mode = WAL;');
      await db.exec('PRAGMA foreign_keys = ON;');
      
      // Create tables with error handling
      try {
        // First create user_tables if it doesn't exist
        await db.exec(`
          CREATE TABLE IF NOT EXISTS user_tables (
            user_id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL UNIQUE,
            created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
            deleted_at_ms INTEGER
          );
        `);
        
        console.log('Database tables verified/created');
      } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
  
  return db;
}

// Create a function to get or create a user's table
async function ensureUserTable(userId: string): Promise<string> {
  const db = await getDb();
  const safeUserId = userId.replace(/[^a-zA-Z0-9_]/g, '_');
  const tableName = `user_${safeUserId}_items`;
  
  try {
    // Ensure repositories are initialized
    await initializeRepositories();
    
    // First ensure user_tables exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      );
    `);
    
    // Check if table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    
    let isNewUser = false;
    
    if (!tableExists) {
      isNewUser = true;
      
      // Create the user's items table with millisecond precision
      await db.exec(`
        CREATE TABLE ${tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL,
          created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
        )
      `);
      
      // Register the user table
      await db.run(
        'INSERT OR IGNORE INTO user_tables (user_id, table_name) VALUES (?, ?)',
        [userId, tableName]
      );
      
      // Add default base point for new users
      try {
        const basePointRepo = getBasePointRepository();
        await basePointRepo.create({
          user_id: userId,
          x: 0,
          y: 0,
          created_at_ms: Date.now(),
          updated_at_ms: Date.now()
        });
        console.log(`Added default base point for user ${userId}`);
      } catch (error) {
        console.error('Error adding default base point:', error);
        // Don't fail the whole operation if base point creation fails
      }
    }
  
  } catch (error) {
    console.error('Error in ensureUserTable:', error);
    throw error;
  }
  
  return tableName;
}

interface Item { 
  id: number;
  user_id?: string;
  data: string;
  created_at_ms?: number;
  created_at?: string;
}

/**
 * Get all items for a specific user
 */
const getUserItems = async (userId: string): Promise<Item[]> => {
  try {
    console.log(`Fetching items for user: ${userId}`);
    const tableName = await ensureUserTable(userId);
    console.log(`Using table: ${tableName}`);
    
    const db = await getDb();
    const query = `
      SELECT id, data, created_at_ms as createdAtMs
      FROM ${tableName}
      ORDER BY created_at_ms DESC
    `;
    
    console.log('Executing query:', query);
    const items = await db.all(query);
    console.log(`Found ${items.length} items`);
    
    return items.map((item: any) => ({
      ...item,
      created_at: new Date(item.createdAtMs).toISOString()
    }));
  } catch (error) {
    console.error('Error in getUserItems:', error);
    throw new Error(`Failed to fetch items: ${error.message}`);
  }
};

/**
 * Add a new item for a specific user, keeping only the 5 most recent items
 */
const addUserItem = async (userId: string, data: string): Promise<Item> => {
  const tableName = await ensureUserTable(userId);
  const db = await getDb();
  
  // Start a transaction
  await db.exec('BEGIN TRANSACTION');
  
  try {
    // Insert the new item
    const result = await db.run(
      `INSERT INTO ${tableName} (data) VALUES (?)`,
      [data]
    );
    
    // Get the newly inserted item
    const item = await db.get(
      `SELECT id, data, created_at_ms as createdAtMs
       FROM ${tableName}
       WHERE id = ?`,
      [result.lastID]
    );
    
    // Get the count of items
    const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
    
    // If we have more than 5 items, delete the oldest ones
    if (countResult.count > 5) {
      await db.run(
        `DELETE FROM ${tableName}
         WHERE id IN (
           SELECT id FROM ${tableName}
           ORDER BY created_at_ms ASC
           LIMIT ?
         )`,
        [countResult.count - 5]
      );
    }
    
    // Commit the transaction
    await db.exec('COMMIT');
    
    return {
      ...item,
      created_at: new Date(item.createdAtMs).toISOString()
    };
  } catch (error) {
    // Rollback the transaction on error
    await db.exec('ROLLBACK');
    throw error;
  }
};

/**
 * Delete all items for a specific user
 */
const deleteAllUserItems = async (userId: string): Promise<void> => {
  const tableName = await ensureUserTable(userId);
  const db = await getDb();
  await db.run(`DELETE FROM ${tableName}`);
};

/**
 * Delete a specific item if it belongs to the user
 */
const deleteUserItem = async (userId: string, itemId: number): Promise<boolean> => {
  const tableName = await ensureUserTable(userId);
  const db = await getDb();
  const result = await db.run(
    `DELETE FROM ${tableName} WHERE id = ?`,
    [itemId]
  ) as { changes?: number };
  
  return (result.changes ?? 0) > 0;
};

/**
 * Delete a user and all their data
 */
const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const db = await getDb();
    const userTableName = `user_${userId}_items`;
    
    // Check if user_tables exists
    const userTablesExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_tables'"
    );
    
    // If no user_tables table exists, nothing to delete
    if (!userTablesExists) {
      console.log(`[deleteUser] user_tables doesn't exist, nothing to delete for user: ${userId}`);
      return true;
    }
    
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Initialize repositories if not already done
      if (!userItemRepo || !basePointRepo) {
        userItemRepo = new UserItemRepository(db);
        basePointRepo = new BasePointRepository(db);
      }
      
      // Remove user from user_tables if it exists
      await db.run('DELETE FROM user_tables WHERE user_id = ?', [userId]);
      
      // Drop user's items table if it exists
      const userTableExists = await db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${userTableName}'`
      );
      
      if (userTableExists) {
        await db.exec(`DROP TABLE IF EXISTS ${userTableName}`);
      }
      
      // Check if base_points table exists before trying to delete
      const basePointsTableExists = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='base_points'"
      );
      
      // Delete all base points for the user if the table exists
      if (basePointsTableExists) {
        await basePointRepo.clearForUser(userId);
      }
      
      await db.exec('COMMIT');
      console.log(`[deleteUser] Successfully deleted all data for user: ${userId}`);
      return true;
      
    } catch (error) {
      // Rollback in case of any error
      await db.exec('ROLLBACK');
      console.error('Error in user deletion transaction:', error);
      return false;
    }
    
  } catch (error) {
    console.error('Error during user deletion:', error);
    return false;
  }
};

function getUserItemRepository(): UserItemRepository {
  if (!userItemRepo) {
    throw new Error('Database not initialized. Call getDb() first.');
  }
  return userItemRepo;
}

function getBasePointRepository(): BasePointRepository {
  if (!basePointRepo) {
    throw new Error('Database not initialized. Call getDb() first.');
  }
  return basePointRepo;
}

// Initialize repositories when the database is ready
async function initializeRepositories() {
  if (!db) await getDb();
  
  try {
    // First ensure the migrations table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Ensure user_tables exists (needed for foreign key in base_points)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      )
    `);
    
    // Ensure base_points table exists (create it directly if it doesn't exist)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS base_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES user_tables(user_id) ON DELETE CASCADE,
        UNIQUE(user_id, x, y)
      )
    `);
    
    // Run migrations (they'll be no-ops if already applied)
    console.log('Running database migrations...');
    try {
      await runMigrations();
    } catch (error) {
      console.error('Migrations failed, but continuing with direct table creation:', error);
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
  
  // Initialize repositories
  if (!userItemRepo) {
    userItemRepo = new UserItemRepository(db);
  }
  if (!basePointRepo) {
    basePointRepo = new BasePointRepository(db);
  }
}

async function runMigrations() {
  if (!db) throw new Error('Database not initialized');
  
  try {
    console.log('Creating migrations table if not exists...');
    // Ensure migrations table exists with proper schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Get all migration files
    const fs = await import('fs/promises');
    const path = await import('path');
    const migrationsDir = path.join(process.cwd(), 'scripts/migrations');
    const migrationFiles = (await fs.readdir(migrationsDir))
      .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'template.ts')
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Get applied migrations - use a transaction to ensure consistency
    let appliedMigrations: {name: string}[] = [];
    try {
      appliedMigrations = await db.all<{name: string}>(
        'SELECT name FROM migrations ORDER BY name'
      );
    } catch (error) {
      // If the query fails, the table might not exist yet
      console.log('No migrations table found, will create it');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
      `);
      appliedMigrations = [];
    }
    
    console.log(`Found ${appliedMigrations.length} applied migrations`);
    
    const appliedSet = new Set(appliedMigrations.map(m => m.name));
    const pendingMigrations = migrationFiles.filter(file => !appliedSet.has(file.replace(/\.ts$/, '')));
    
    try {
      for (const file of migrationFiles) {
        const migrationName = file.replace(/\.ts$/, '');
        
        if (!appliedSet.has(migrationName)) {
          console.log(`\n=== Running migration: ${migrationName} ===`);
          const migrationPath = path.join(migrationsDir, file);
          console.log(`Importing migration from: ${migrationPath}`);
          
          try {
            // Import the migration module using dynamic import with absolute path
            const migrationPath = path.join(process.cwd(), 'scripts', 'migrations', file.replace(/\.ts$/, ''));
            const migration = await import(/* @vite-ignore */ migrationPath);
            
            if (!migration.up) {
              throw new Error(`Migration ${migrationName} is missing the 'up' function`);
            }
            
            console.log(`Executing migration: ${migrationName}`);
            
            // Use the database connection directly
            console.log(`Executing migration: ${migrationName}`);
            await migration.up(db);
            
            // Mark migration as applied
            console.log(`Marking migration as applied: ${migrationName}`);
            try {
              await db.run(
                'INSERT OR IGNORE INTO migrations (name) VALUES (?)',
                [migrationName]
              );
              console.log(`✅ Successfully applied migration: ${migrationName}`);
            } catch (error) {
              if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
                console.log(`ℹ️ Migration already marked as applied: ${migrationName}`);
              } else {
                throw error;
              }
            }
          } catch (error) {
            console.error(`❌ Failed to apply migration ${migrationName}:`, error);
            throw error;
          }
        } else {
          console.log(`✓ Migration already applied: ${migrationName}`);
        }
      }
      
      if (pendingMigrations.length > 0) {
        console.log('All migrations completed successfully');
      } else {
        console.log('No pending migrations to apply');
      }
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Export all necessary functions
export {
  getDb,
  ensureUserTable,
  getUserItems,
  addUserItem,
  deleteAllUserItems,
  deleteUserItem,
  deleteUser,
  getUserItemRepository,
  getBasePointRepository,
  initializeRepositories,
  runMigrations
};

export type { Item };
