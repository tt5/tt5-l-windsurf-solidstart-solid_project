import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, access, constants } from 'node:fs/promises';
import type { 
  Database, 
  DbMigration, 
  TableInfo, 
  MigrationFunction, 
  MigrationFile 
} from '../types/database';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = join(process.cwd(), 'data', 'app.db');
const BACKUP_DIR = join(process.cwd(), 'data', 'backups');

export const ensureDbDirectory = async () => {
  await Promise.all([
    mkdir(dirname(DB_PATH), { recursive: true }),
    mkdir(BACKUP_DIR, { recursive: true })
  ]);
};

export const createDatabaseConnection = async (): Promise<Database> => {
  await ensureDbDirectory();
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
  await db.exec('PRAGMA foreign_keys = ON');
  return db;
};

export const databaseExists = async (): Promise<boolean> => {
  try {
    await access(DB_PATH, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const backupDatabase = async (): Promise<string> => {
  const backupPath = join(BACKUP_DIR, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  const db = await createDatabaseConnection();
  try {
    await db.backup(backupPath);
    return backupPath;
  } finally {
    await db.close();
  }
};

export const applyMigration = async (db: Database, migration: MigrationFile) => {
  console.log(`🔄 Applying migration: ${migration.name}`);
  
  await db.exec('BEGIN TRANSACTION');
  try {
    await migration.up(db);
    await db.run(
      'INSERT INTO migrations (name, applied_at) VALUES (?, strftime("%s", "now"))',
      migration.name
    );
    await db.exec('COMMIT');
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
};
