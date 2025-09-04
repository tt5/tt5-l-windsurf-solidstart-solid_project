import { Database, DbMigration, TableInfo } from '../types/database';
import { createDatabaseConnection } from '../core/db';

export type { Database, DbMigration, TableInfo };

type SqlValue = string | number | boolean | null | Buffer | Date;
type SqlParams = SqlValue | SqlValue[] | Record<string, SqlValue>;

export interface QueryResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
}

export const ensureDataDirectory = async (): Promise<boolean> => {
  try {
    const db = await createDatabaseConnection();
    await db.close();
    return true;
  } catch (error) {
    console.error('Failed to ensure data directory:', error);
    return false;
  }
};

export const getDbConnection = createDatabaseConnection;

export const checkMigrationsTable = (db: Database) => 
  db.get<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'").then(Boolean).catch(() => false);

export const ensureMigrationsTable = (db: Database) => 
  checkMigrationsTable(db).then(exists => !exists && db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )`
  ));

export const getAppliedMigrations = (db: Database) => 
  db.all<DbMigration>('SELECT * FROM migrations ORDER BY id ASC');

export const getAllTables = (db: Database) => 
  db.all<{name: string; type: string}>(
    "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'"
  ).catch(() => []);

export const tableExists = (db: Database, tableName: string) => 
  db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  ).then(Boolean).catch(() => false);

export const getTableRowCount = (db: Database, tableName: string) => 
  db.get<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`)
    .then(r => r?.count ?? 0)
    .catch(() => 0);

/**
 * Get the SQL used to create a table
 */
export const getTableSchema = async (db: Database, tableName: string): Promise<string | null> => {
  try {
    const result = await db.get<{ sql: string }>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result?.sql || null;
  } catch (error) {
    console.error(`Error getting schema for table ${tableName}:`, error);
    return null;
  }
};

/**
 * Get all migration files from the migrations directory
 */
export const getMigrationFiles = async (): Promise<string[]> => {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');
  
  try {
    const migrationsDir = join(process.cwd(), 'scripts', 'migrations');
    const files = await readdir(migrationsDir);
    
    return files
      .filter(file => /^\d+_.+\.(js|ts)$/.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (error: any) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

/**
 * Load a migration module
 */
export const loadMigration = async (file: string) => {
  const { default: migration } = await import(`../migrations/${file}`);
  
  if (!migration || typeof migration.up !== 'function') {
    throw new Error(`Migration ${file} must export an object with an 'up' function`);
  }
  
  return {
    name: file.replace(/\.[^/.]+$/, ''),
    up: migration.up,
    down: migration.down
  };
};

/**
 * Execute a query and return all results
 */
export const executeQuery = async <T = any>(
  db: Database,
  query: string,
  params: SqlParams[] = []
): Promise<T[]> => {
  try {
    return await db.all<T>(query, ...params);
  } catch (error) {
    console.error('Error executing query:', error);
    throw new Error(`Query failed: ${error.message}`);
  }
};

/**
 * Execute a query and return the first result or null
 */
export const queryOne = async <T = any>(
  db: Database,
  query: string,
  params: SqlParams[] = []
): Promise<T | null> => {
  try {
    return (await db.get<T>(query, ...params)) || null;
  } catch (error) {
    console.error('Error executing query:', error);
    throw new Error(`Query failed: ${error.message}`);
  }
};

/**
 * Execute a query that doesn't return results (INSERT, UPDATE, DELETE, etc.)
 */
export const execute = async (
  db: Database,
  query: string,
  params: SqlParams[] = []
): Promise<{ lastID?: number | bigint; changes?: number }> => {
  try {
    return await db.run(query, ...params);
  } catch (error) {
    console.error('Error executing query:', error);
    throw new Error(`Execute failed: ${error.message}`);
  }
};

/**
 * Get detailed information about a table's columns
 */
export const getTableInfo = (db: Database, tableName: string): Promise<TableInfo[]> => 
  db.all<TableInfo>(`PRAGMA table_info(${tableName})`);

/**
 * Check if a column exists in a table
 */
export const columnExists = async (
  db: Database,
  tableName: string,
  columnName: string
): Promise<boolean> => {
  try {
    const columns = await getTableInfo(db, tableName);
    return columns.some(col => col.name === columnName);
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists:`, error);
    return false;
  }
};

/**
 * Get the names of all indexes for a table
 */
export const getTableIndexes = (
  db: Database,
  tableName: string
): Promise<Array<{name: string, unique: 0 | 1, sql: string}>> => 
  db.all<{name: string, unique: 0 | 1, sql: string}>(
    `SELECT name, "unique" as unique, sql FROM sqlite_master 
     WHERE type='index' AND tbl_name=? AND sql IS NOT NULL`,
    [tableName]
  );
