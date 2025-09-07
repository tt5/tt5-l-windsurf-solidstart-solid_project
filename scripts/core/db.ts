import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir, access, constants, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { 
  Database, 
  DbMigration, 
  MigrationFile 
} from '../types/database';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = join(process.cwd(), 'data', 'app.db');
const BACKUP_DIR = join(process.cwd(), 'data', 'backups');

export const ensureDbDirectory = async (): Promise<boolean> => {
  try {
    await Promise.all([
      mkdir(dirname(DB_PATH), { recursive: true }),
      mkdir(BACKUP_DIR, { recursive: true })
    ]);
    return true;
  } catch (error) {
    console.error('Failed to create database directories:', error);
    return false;
  }
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

interface BackupOptions {
  maxBackups?: number;
  backupDir?: string;
}

const DEFAULT_BACKUP_OPTIONS: Required<BackupOptions> = {
  maxBackups: 5,
  backupDir: BACKUP_DIR
};

export const backupDatabase = async (options: BackupOptions = {}): Promise<string> => {
  const { maxBackups, backupDir } = { ...DEFAULT_BACKUP_OPTIONS, ...options };
  
  // Ensure backup directory exists
  if (!existsSync(backupDir)) {
    await mkdir(backupDir, { recursive: true });
  }

  // Create timestamped backup filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(backupDir, `backup-${timestamp}.db`);
  
  const db = await createDatabaseConnection();
  
  try {
    console.log(`🔧 Creating database backup at: ${backupPath}`);
    await db.backup(backupPath);
    console.log('✅ Backup completed successfully');
    
    // Clean up old backups if needed
    await cleanupOldBackups(backupDir, maxBackups);
    
    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    // Clean up failed backup file if it was partially created
    try {
      if (existsSync(backupPath)) {
        await unlink(backupPath);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up failed backup:', cleanupError);
    }
    throw error;
  } finally {
    await db.close().catch(error => {
      console.error('Error closing database connection:', error);
    });
  }
};

async function cleanupOldBackups(backupDir: string, maxBackups: number): Promise<void> {
  try {
    const files = (await readdir(backupDir))
      .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
      .sort()
      .reverse();

    // Keep only the most recent maxBackups files
    const filesToDelete = files.slice(maxBackups);
    
    for (const file of filesToDelete) {
      const filePath = join(backupDir, file);
      try {
        await unlink(filePath);
        console.log(`♻️  Cleaned up old backup: ${file}`);
      } catch (error) {
        console.error(`Failed to delete old backup ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during backup cleanup:', error);
  }
}

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
