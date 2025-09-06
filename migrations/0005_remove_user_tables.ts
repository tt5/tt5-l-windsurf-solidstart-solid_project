// Remove user_tables table and update base_points foreign key
export const up = async (db) => {
  await db.exec(`
    -- Drop the user_tables table
    DROP TABLE IF EXISTS user_tables;

    -- Create a new base_points table with the updated foreign key
    CREATE TABLE IF NOT EXISTS base_points_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, x, y)
    );

    -- Copy data to the new table
    INSERT INTO base_points_new (id, user_id, x, y, created_at_ms, updated_at_ms)
    SELECT id, user_id, x, y, created_at_ms, updated_at_ms FROM base_points;

    -- Drop the old table and rename the new one
    DROP TABLE base_points;
    ALTER TABLE base_points_new RENAME TO base_points;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);
    CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);
  `);
};

export const down = async (db) => {
  await db.exec(`
    -- Recreate user_tables table
    CREATE TABLE IF NOT EXISTS user_tables (
      user_id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL UNIQUE,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      deleted_at_ms INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_tables_table_name ON user_tables(table_name);

    -- Revert base_points foreign key
    CREATE TABLE IF NOT EXISTS base_points_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES user_tables(user_id) ON DELETE CASCADE,
      UNIQUE(user_id, x, y)
    );

    -- Copy data back
    INSERT INTO base_points_new (id, user_id, x, y, created_at_ms, updated_at_ms)
    SELECT id, user_id, x, y, created_at_ms, updated_at_ms FROM base_points;

    -- Replace the table
    DROP TABLE base_points;
    ALTER TABLE base_points_new RENAME TO base_points;

    -- Recreate indexes
    CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);
    CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);
  `);
};
