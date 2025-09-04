import sqlite3 from 'sqlite3';
const { Database } = sqlite3;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, access, constants } from 'node:fs/promises';
import { promisify } from 'util';

type Database = sqlite3.Database;

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = join(process.cwd(), 'data', 'app.db');
const BACKUP_DIR = join(process.cwd(), 'data', 'backups');

export interface Migration {
  id: string;
  description: string;
  up: (db: Database) => Promise<void>;
  down?: (db: Database) => Promise<void>;
}

export async function ensureDbDirectory() {
  await mkdir(dirname(DB_PATH), { recursive: true });
  await mkdir(BACKUP_DIR, { recursive: true });
}

export async function createDatabaseConnection(): Promise<Database> {
  // Create the database directory if it doesn't exist
  await ensureDbDirectory();
  
  return new Promise((resolve, reject) => {
    // Create a new database connection
    const db = new Database(DB_PATH, (err) => {
      if (err) {
        return reject(err);
      }
      
      // Configure database with optimal settings
      db.serialize(() => {
        db.run('PRAGMA journal_mode = WAL;');
        db.run('PRAGMA foreign_keys = ON;');
        db.run('PRAGMA synchronous = NORMAL;');
        
        resolve(db);
      });
    });
  });
}

export async function databaseExists(): Promise<boolean> {
  try {
    await access(DB_PATH, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function backupDatabase(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(BACKUP_DIR, `app.db.backup-${timestamp}`);
  
  const { copyFile } = await import('node:fs/promises');
  await copyFile(DB_PATH, backupPath);
  
  return backupPath;
}

export function getBackupPath(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return join(BACKUP_DIR, `app.db.backup-${timestamp}`);
}

export function applyMigration(db: Database, migration: Migration) {
  console.log(`🔄 Applying migration: ${migration.id} - ${migration.description}`);
  
  // Wrap in a transaction for safety
  const transaction = db.transaction(() => {
    migration.up(db);
    
    // Record the migration
    db.prepare(
      'INSERT INTO migrations (id, description) VALUES (?, ?)'
    ).run(migration.id, migration.description);
  });
  
  transaction();
  console.log(`✅ Applied migration: ${migration.id}`);
}

export const PATHS = {
  DB: DB_PATH,
  BACKUP_DIR,
  getBackupPath: getBackupPath
};

export default {
  ensureDbDirectory,
  createDatabaseConnection,
  databaseExists,
  backupDatabase,
  getBackupPath,
  applyMigration,
  PATHS
};
