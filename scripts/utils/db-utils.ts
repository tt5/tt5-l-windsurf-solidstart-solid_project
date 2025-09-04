import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';

export interface Migration {
  id: number;
  name: string;
  applied_at: string;
}

export async function getDbConnection(dbPath?: string): Promise<Database> {
  const db = await open({
    filename: dbPath || join(process.cwd(), 'data', 'app.db'),
    driver: sqlite3.Database
  });
  return db;
}

export async function checkMigrationsTable(db: Database): Promise<boolean> {
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
  );
  return !!result;
}

export async function getAppliedMigrations(db: Database): Promise<Migration[]> {
  const hasMigrations = await checkMigrationsTable(db);
  if (!hasMigrations) return [];
  return db.all<Migration>('SELECT * FROM migrations ORDER BY id');
}

export async function getAllTables(db: Database): Promise<{name: string}[]> {
  return db.all<{name: string}>("SELECT name FROM sqlite_master WHERE type='table'");
}

export async function tableExists(db: Database, tableName: string): Promise<boolean> {
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return !!result;
}

export async function getTableRowCount(db: Database, tableName: string): Promise<number> {
  const result = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
  return result?.count || 0;
}

export async function getTableSchema(db: Database, tableName: string): Promise<{sql: string} | null> {
  try {
    return await db.get(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
  } catch (error) {
    console.error(`Error getting schema for table ${tableName}:`, error);
    return null;
  }
}

export async function executeQuery<T = any>(
  db: Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    return await db.all(query, ...params);
  } catch (error) {
    console.error('Error executing query:', { query, params, error });
    throw error;
  }
}
