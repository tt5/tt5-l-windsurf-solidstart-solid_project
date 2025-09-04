import { open, Database as SqliteDatabase, ISqlite } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { mkdir } from 'fs/promises';

// Re-export types for convenience
export type Database = SqliteDatabase<sqlite3.Database, sqlite3.Statement>;

// Type for SQLite query parameters
type SqlValue = string | number | boolean | null | Buffer | Date;
type SqlParams = SqlValue | SqlValue[] | Record<string, SqlValue>;

// Extend the Database type with additional methods
declare module 'sqlite' {
  interface Database<Driver, Stmt> {
    run(sql: string, ...params: any[]): Promise<{ lastID?: number | bigint; changes?: number }>;
    all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
    get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
    exec(sql: string): Promise<void>;
  }
}

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

export async function ensureDataDirectory(): Promise<void> {
  const dataDir = join(process.cwd(), 'data');
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create data directory: ${error.message}`);
    }
  }
}

/**
 * Get a database connection
 * @param dbPath Optional path to the database file
 * @returns A database connection
 */
export async function getDbConnection(dbPath?: string): Promise<Database> {
  const dbPathToUse = dbPath || join(process.cwd(), 'data', 'app.db');
  try {
    const db = await open({
      filename: dbPathToUse,
      driver: sqlite3.Database
    });
    
    // Enable foreign key constraints
    await db.exec('PRAGMA foreign_keys = ON');
    
    return db;
  } catch (error) {
    throw new Error(`Failed to connect to database at ${dbPathToUse}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function checkMigrationsTable(db: Database): Promise<boolean> {
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
  );
  return !!result;
}

export async function getAppliedMigrations(db: Database): Promise<DbMigration[]> {
  const hasMigrations = await checkMigrationsTable(db);
  if (!hasMigrations) return [];
  return db.all<DbMigration>('SELECT id, name, applied_at FROM migrations ORDER BY id');
}

export async function getAllTables(db: Database): Promise<{name: string}[]> {
  return db.all<{name: string}>(
    "SELECT name FROM sqlite_master " +
    "WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations' " +
    "ORDER BY name"
  );
}

export async function tableExists(db: Database, tableName: string): Promise<boolean> {
  const result = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return !!result;
}

export async function getTableRowCount(db: Database, tableName: string): Promise<number> {
  const result = await db.get<{count: number}>(`SELECT COUNT(*) as count FROM ${tableName}`);
  return result?.count ?? 0;
}

/**
 * Get the SQL used to create a table
 */
export async function getTableSchema(db: Database, tableName: string): Promise<string | null> {
  try {
    const result = await db.get<{sql: string}>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return result?.sql || null;
  } catch (error) {
    console.error(`Error getting schema for table ${tableName}:`, error);
    return null;
  }
}

/**
 * Execute a query and return all results
 */
/**
 * Execute a query and return all results
 */
/**
 * Execute a query and return all results
 * @param db Database connection
 * @param query SQL query string
 * @param params Query parameters
 * @returns Array of results
 */
export async function executeQuery<T = any>(
  db: Database,
  query: string,
  params: SqlParams[] = []
): Promise<T[]> {
  try {
    // Handle both array and object parameters
    if (Array.isArray(params[0])) {
      return await db.all<T>(query, ...(params as SqlValue[]));
    } else if (params && Object.keys(params).length > 0) {
      return await db.all<T>(query, params);
    } else {
      return await db.all<T>(query);
    }
  } catch (error) {
    console.error('Error executing query:', { query, params, error });
    throw error;
  }
}

/**
 * Execute a query and return the first result or null
 */
/**
 * Execute a query and return the first result or null
 */
/**
 * Execute a query and return the first result
 * @param db Database connection
 * @param query SQL query string
 * @param params Query parameters
 * @returns First result or null if no results
 */
export async function queryOne<T = any>(
  db: Database,
  query: string,
  params: SqlParams[] = []
): Promise<T | null> {
  try {
    // Handle both array and object parameters
    if (Array.isArray(params[0])) {
      return (await db.get<T>(query, ...(params as SqlValue[]))) || null;
    } else if (params && Object.keys(params).length > 0) {
      return (await db.get<T>(query, params)) || null;
    } else {
      return (await db.get<T>(query)) || null;
    }
  } catch (error) {
    console.error('Error executing query:', { query, params, error });
    throw error;
  }
}

/**
 * Execute a query that doesn't return results (INSERT, UPDATE, DELETE, etc.)
 */
/**
 * Execute a query that doesn't return results (INSERT, UPDATE, DELETE, etc.)
 */
/**
 * Execute a query that doesn't return results (INSERT, UPDATE, DELETE, etc.)
 * @param db Database connection
 * @param query SQL query string
 * @param params Query parameters
 * @returns Result of the execution
 */
export async function execute(
  db: Database,
  query: string,
  params: SqlParams[] = []
): Promise<ISqlite.RunResult> {
  try {
    // Handle both array and object parameters
    if (Array.isArray(params[0])) {
      return await db.run(query, ...(params as SqlValue[]));
    } else if (params && Object.keys(params).length > 0) {
      return await db.run(query, params);
    } else {
      return await db.run(query);
    }
  } catch (error) {
    console.error('Error executing query:', { query, params, error });
    throw error;
  }
}

/**
 * Get detailed information about a table's columns
 */
export async function getTableInfo(
  db: Database,
  tableName: string
): Promise<TableInfo[]> {
  return db.all<TableInfo>(`PRAGMA table_info(${tableName})`);
}

/**
 * Check if a column exists in a table
 */
export async function columnExists(
  db: Database,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const columns = await db.all(
    `PRAGMA table_info(${tableName}) WHERE name = ?`,
    [columnName]
  );
  return columns.length > 0;
}

/**
 * Get the names of all indexes for a table
 */
export async function getTableIndexes(
  db: Database,
  tableName: string
): Promise<{name: string, unique: 0 | 1, sql: string}[]> {
  return db.all(
    `SELECT name, [unique], sql 
     FROM sqlite_master 
     WHERE type = 'index' AND tbl_name = ? 
     ORDER BY name`,
    [tableName]
  );
}
