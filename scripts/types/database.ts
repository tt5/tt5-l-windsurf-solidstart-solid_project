import { Database as SqliteDatabase } from 'sqlite';
import sqlite3 from 'sqlite3';

export type Database = SqliteDatabase<sqlite3.Database, sqlite3.Statement>;

// Define the BackupMetadata interface since it's not included in sqlite3 types
export interface BackupMetadata {
  failed: number;
  remaining: number;
  pageCount: number;
  retryErrors: number;
  totalPages: number;
  totalErrors: number;
}

declare module 'sqlite' {
  interface Database<Driver, Stmt> {
    run(sql: string, ...params: any[]): Promise<{ lastID?: number | bigint; changes?: number }>;
    all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
    get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
    exec(sql: string): Promise<void>;
    backup(destination: string): Promise<BackupMetadata>;
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

export type MigrationFunction = (db: Database) => Promise<void>;

export interface MigrationFile {
  id: string;
  name: string;
  up: MigrationFunction;
  down?: MigrationFunction;
}

export interface MigrationResult {
  success: boolean;
  applied: number;
  error?: string;
  pendingMigrations?: string[];
}

export interface InitResult {
  success: boolean;
  error?: string;
  tablesCreated: string[];
}

export interface CheckResult {
  success: boolean;
  error?: string;
  dbExists: boolean;
  tables: Array<{
    name: string;
    rowCount: number;
    schema: string;
  }>;
  migrations: DbMigration[];
  missingTables: string[];
  requiredTables: string[];
}
