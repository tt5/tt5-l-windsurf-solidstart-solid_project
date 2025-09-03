import Database from 'better-sqlite3';
import { access, mkdir } from 'node:fs/promises';
import path from 'path';
import { PATHS } from './paths';

export interface TableInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface Migration {
  up: (db: Database.Database) => void | Promise<void>;
  down?: (db: Database.Database) => void | Promise<void>;
}

export async function ensureDbDirectory(): Promise<void> {
  try {
    await mkdir(path.dirname(PATHS.DB), { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

export async function databaseExists(): Promise<boolean> {
  try {
    await access(PATHS.DB);
    return true;
  } catch {
    return false;
  }
}

export function createDatabaseConnection(): Database.Database {
  return new Database(PATHS.DB, {
    verbose: process.env.DEBUG ? console.log : undefined,
  });
}

export function getTableInfo(db: Database.Database, tableName: string): TableInfo[] {
  return db.prepare(`PRAGMA table_info(${tableName})`).all() as TableInfo[];
}

export function tableExists(db: Database.Database, tableName: string): boolean {
  try {
    db.prepare(`SELECT 1 FROM ${tableName} LIMIT 1`).get();
    return true;
  } catch (error) {
    return false;
  }
}

export async function backupDatabase(): Promise<string> {
  const backupPath = getBackupPath();
  await mkdir(path.dirname(backupPath), { recursive: true });
  
  // For now, we'll use a simple file copy for backup
  // since the backup API might not be available in all SQLite versions
  const { copyFile } = await import('node:fs/promises');
  await copyFile(PATHS.DB, backupPath);
  
  return backupPath;
}

// Re-export common types and utilities
import type { Database as SQLiteDatabase } from 'better-sqlite3';
export type { Database } from 'better-sqlite3';
import { PATHS, getBackupPath } from './paths';

export { PATHS, getBackupPath };
