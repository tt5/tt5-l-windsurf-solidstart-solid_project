import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../..');
export const SCRIPTS_DIR = __dirname;

export const PATHS = {
  // Database
  DB: path.join(ROOT_DIR, 'data/app.db'),
  DB_BACKUP_DIR: path.join(ROOT_DIR, 'data/backups'),
  
  // Migration files
  MIGRATIONS_DIR: path.join(ROOT_DIR, 'scripts/migrations'),
  
  // Schema
  SCHEMA_FILE: path.join(ROOT_DIR, 'scripts/schema.sql'),
  
  // Logs
  LOGS_DIR: path.join(ROOT_DIR, 'logs')
} as const;

export function getBackupPath(): string {
  const timestamp = new Date().getTime();
  return path.join(PATHS.DB_BACKUP_DIR, `app.db.backup-${timestamp}`);
}
