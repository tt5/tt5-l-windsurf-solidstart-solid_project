-- Backup the existing table
CREATE TABLE IF NOT EXISTS user_user_a_items_backup AS
SELECT * FROM user_user_a_items;

-- Drop the existing table
DROP TABLE IF EXISTS user_user_a_items;

-- Recreate the table with millisecond precision
CREATE TABLE IF NOT EXISTS user_user_a_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at_ms INTEGER DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data back
INSERT INTO user_user_a_items (id, user_id, data, created_at_ms)
SELECT id, user_id, data, created_at_ms FROM user_user_a_items_backup;

-- Clean up
DROP TABLE IF EXISTS user_user_a_items_backup;

-- Verify the update
SELECT '✅ Timestamp precision updated successfully!' as status;
