import { Database } from 'sqlite3';
import { promisify } from 'util';
import { join } from 'path';
import { readdir } from 'fs/promises';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function getAppliedMigrations(db: Database): Promise<Set<string>> {
  const all = promisify(db.all.bind(db));
  
  try {
    const rows = await all('SELECT name FROM migrations');
    return new Set(rows.map((r: any) => r.name));
  } catch (error) {
    // If migrations table doesn't exist yet, return empty set
    return new Set();
  }
}

async function runMigrations() {
  const db = new Database('data/app.db');
  const run = promisify(db.run.bind(db));
  const all = promisify(db.all.bind(db));
  
  try {
    // Ensure migrations directory exists
    const migrationFiles = (await readdir(MIGRATIONS_DIR))
      .filter(f => f.endsWith('.ts') && f !== 'index.ts')
      .sort();
    
    const appliedMigrations = await getAppliedMigrations(db);
    let migrationsRun = 0;
    
    for (const file of migrationFiles) {
      const migrationName = file.replace(/\.ts$/, '');
      
      if (!appliedMigrations.has(migrationName)) {
        console.log(`Running migration: ${migrationName}`);
        const migration = await import(`./migrations/${migrationName}`);
        await migration.up(db);
        migrationsRun++;
      }
    }
    
    console.log(`Migrations complete. ${migrationsRun} migrations were run.`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

runMigrations().catch(console.error);
