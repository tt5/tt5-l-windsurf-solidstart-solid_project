import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promisify } from 'util';
import path from 'path';

const { Database } = sqlite3;

async function runMigration() {
  try {
    console.log('Opening database...');
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'app.db'),
      driver: Database
    });

    const run = promisify(db.run.bind(db));
    
    console.log('Starting transaction...');
    await run('BEGIN TRANSACTION');
    
    try {
      console.log('Creating base_points table...');
      await run(`
        CREATE TABLE IF NOT EXISTS base_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          x INTEGER NOT NULL,
          y INTEGER NOT NULL,
          created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (user_id) REFERENCES user_tables(user_id) ON DELETE CASCADE,
          UNIQUE(user_id, x, y)
        );
      `);
      
      console.log('Creating indexes...');
      await run('CREATE INDEX IF NOT EXISTS idx_base_points_user_id ON base_points(user_id);');
      await run('CREATE INDEX IF NOT EXISTS idx_base_points_xy ON base_points(x, y);');
      
      console.log('Marking migration as applied...');
      await run("INSERT INTO migrations (name) VALUES ('0002_add_base_points')");
      
      await run('COMMIT');
      console.log('Migration completed successfully!');
    } catch (error) {
      await run('ROLLBACK');
      console.error('Migration failed, rolling back:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
