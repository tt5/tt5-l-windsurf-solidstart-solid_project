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
  ITEMS_TABLE: `
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000 + (strftime('%f','now') - strftime('%S','now') * 1000)),
      created_at TEXT GENERATED ALWAYS AS (datetime(created_at_ms / 1000, 'unixepoch')) VIRTUAL
    )
  `,
  INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_items_created_ms ON items(created_at_ms)',
  ],
} as const;

export const MIGRATIONS = {
  ADD_USER_ID: `
    ALTER TABLE items 
    ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default'
  `,
  ADD_CREATED_AT_MS: `
    ALTER TABLE items 
    ADD COLUMN created_at_ms INTEGER
  `,
  UPDATE_TIMESTAMPS: `
    UPDATE items 
    SET created_at_ms = (julianday(created_at) * 86400000)
    WHERE created_at_ms IS NULL
  `,
} as const;
