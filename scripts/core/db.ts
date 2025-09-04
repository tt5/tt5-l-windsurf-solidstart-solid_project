import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, access, constants } from 'node:fs/promises';

export type Database = SqliteDatabase<sqlite3.Database, sqlite3.Statement>;

// Extend the Database type with additional methods
declare module 'sqlite' {
  interface Database<Driver, Stmt> {
    run(sql: string, ...params: any[]): Promise<{ lastID?: number | bigint; changes?: number }>;
    all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
    get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
    exec(sql: string): Promise<void>;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = join(process.cwd(), 'data', 'app.db');
const BACKUP_DIR = join(process.cwd(), 'data', 'backups');

export interface DbMigration {
  id: number;
  name: string;
  applied_at: number;
}

export interface TableInfo {
  cid: number;
  name: string;
  type: string;
  notnull: 0 | 1;
  dflt_value: any;
  pk: 0 | 1;
}

export type MigrationFunction = (db: Database) => Promise<void>;

export interface MigrationFile {
  id: string;
  name: string;
  up: MigrationFunction;
  down?: MigrationFunction;
}

export async function ensureDbDirectory() {
  await mkdir(dirname(DB_PATH), { recursive: true });
  await mkdir(BACKUP_DIR, { recursive: true });
}

export async function createDatabaseConnection(): Promise<Database> {
  await ensureDbDirectory();
  
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  // Configure database with optimal settings
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec('PRAGMA synchronous = NORMAL;');
  
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
