import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PATHS = {
  ROOT: path.join(__dirname, '..'),
  DATA: path.join(__dirname, '..', 'data'),
  DB: path.join(__dirname, '..', 'data', 'app.db'),
} as const;

export const SCHEMA = {
  // Schema definitions for database tables
} as const;

export const MIGRATIONS = {
  // Database migrations will be defined here
} as const;
