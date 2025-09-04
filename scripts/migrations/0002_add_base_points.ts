import { Database } from 'sqlite';

export const name = '0002_add_base_points';

export async function up(db: Database): Promise<void> {
  console.log('Creating base_points table...');
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

  console.log('Creating indexes...');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);');
  
  console.log('Marking migration as applied...');
  try {
    await db.run('INSERT INTO migrations (name) VALUES (?)', name);
    console.log('Migration 0002_add_base_points completed successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      console.log('Migration already applied, skipping...');
    } else {
      throw error;
    }
  }
}

export async function down(db: Database): Promise<void> {
  console.log('Dropping indexes...');
  await db.exec('DROP INDEX IF EXISTS idx_base_points_xy');
  await db.exec('DROP INDEX IF EXISTS idx_base_points_user_id');
  
  console.log('Dropping base_points table...');
  await db.exec('DROP TABLE IF EXISTS base_points');
  
  console.log('Removing migration record...');
  await db.run('DELETE FROM migrations WHERE name = ?', name);
  console.log('Rollback of 0002_add_base_points completed');
}
