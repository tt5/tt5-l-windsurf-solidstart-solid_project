-- Initial database schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  created_at_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- User tables registry
CREATE TABLE IF NOT EXISTS user_tables (
  user_id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
  deleted_at_ms INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Migrations table (used by the migration system)
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
);

-- Enable foreign key support
PRAGMA foreign_keys = ON;
