import { Database } from 'sqlite';

export const name = '0000_combined_migration';

export async function up(db: Database): Promise<void> {
  console.log('Starting combined migration...');
  
  // Create initial tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  await db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  
  // Create base_points table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS base_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, x, y)
    );
  `);

  // Create indexes for base_points
  await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);');
  
  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  
  // Add default base point for existing users if any
  const user = await db.get('SELECT id as user_id FROM users LIMIT 1');
  if (user) {
    const hasBasePoints = await db.get(
      'SELECT COUNT(*) as count FROM base_points WHERE user_id = ?',
      [user.user_id]
    );
    
    if (!hasBasePoints || hasBasePoints.count === 0) {
      await db.run(
        'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
        [user.user_id]
      );
      console.log('Added default base point at (0,0) for user:', user.user_id);
    }
  }
  
  console.log('Combined migration completed successfully');
}

export async function down(db: Database): Promise<void> {
  console.log('Starting combined migration rollback...');
  
  // Drop all tables in reverse order of creation
  await db.exec('DROP INDEX IF EXISTS idx_base_points_xy');
  await db.exec('DROP INDEX IF EXISTS idx_base_points_user_id');
  await db.exec('DROP TABLE IF EXISTS base_points');
  
  await db.exec('DROP INDEX IF EXISTS idx_users_username');
  await db.exec('DROP TABLE IF EXISTS users');
  
  console.log('Combined migration rollback completed');
}
