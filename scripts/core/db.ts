import { Database } from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, access, constants } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(process.cwd(), 'data', 'app.db');
const BACKUP_DIR = join(process.cwd(), 'data', 'backups');

export interface Migration {
  id: string;
  description: string;
  up: (db: Database) => void;
  down?: (db: Database) => void;
}

export async function ensureDbDirectory() {
  await mkdir(dirname(DB_PATH), { recursive: true });
  await mkdir(BACKUP_DIR, { recursive: true });
}

let BetterSqlite3: any;

export async function createDatabaseConnection(): Promise<Database> {
  // Dynamic import to handle ESM properly
  if (!BetterSqlite3) {
    BetterSqlite3 = (await import('better-sqlite3')).default;
  }
  
  const db = new BetterSqlite3(DB_PATH);
  
  // Configure database with optimal settings
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  
  return db;
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
  getBackupPath: () => getBackupPath()
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
