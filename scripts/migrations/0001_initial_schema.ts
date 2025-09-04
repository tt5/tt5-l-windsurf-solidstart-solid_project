import { Database } from 'sqlite3';
import { promisify } from 'util';

export const name = '0001_initial_schema';

export async function up(db: Database): Promise<void> {
  const run = promisify(db.run.bind(db));
  
  await run('BEGIN TRANSACTION');
  
  try {
    // Create migrations table
    await run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Create user_tables
    await run(`
      CREATE TABLE IF NOT EXISTS user_tables (
        user_id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL UNIQUE,
        created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        deleted_at_ms INTEGER
      );
    `);
    
    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);');
    await run('CREATE INDEX IF NOT EXISTS idx_user_tables_table_name ON user_tables(table_name);');
    
    // Mark this migration as applied
    await run('INSERT INTO migrations (name) VALUES (?)', [name]);
    
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}

export async function down(db: Database): Promise<void> {
  const run = promisify(db.run.bind(db));
  
  await run('BEGIN TRANSACTION');
  
  try {
    // Drop all user tables
    const userTables = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT table_name FROM user_tables WHERE deleted_at_ms IS NULL", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const { table_name } of userTables) {
      await run(`DROP TABLE IF EXISTS ${table_name}`);
    }
    
    // Drop system tables
    await run('DROP TABLE IF EXISTS user_tables');
    await run('DELETE FROM migrations WHERE name = ?', [name]);
    
    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }
}
