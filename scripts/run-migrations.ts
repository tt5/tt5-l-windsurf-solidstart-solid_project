import { join } from 'path';
import { readdir } from 'fs/promises';
import { getDbConnection } from './utils/db-utils';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

interface MigrationResult {
  success: boolean;
  applied: number;
  error?: string;
}

async function ensureMigrationsTable(db: any): Promise<void> {
  await db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function runMigrations(): Promise<MigrationResult> {
  console.log('\n=== Running Migrations ===');
  
  try {
    // 1. Initialize database connection
    console.log('\n1. Connecting to database...');
    const db = await getDbConnection();
    
    try {
      // 2. Ensure migrations table exists
      await ensureMigrationsTable(db);
      
      // 3. Get migration files
      const migrationFiles = (await readdir(MIGRATIONS_DIR))
        .filter(f => f.endsWith('.ts') && f !== 'index.ts')
        .sort();
      
      if (migrationFiles.length === 0) {
        console.log('\nℹ️  No migration files found');
        return { success: true, applied: 0 };
      }
      
      // 4. Get applied migrations
      const appliedMigrations = new Set(
        (await db.all('SELECT name FROM migrations')).map((m: any) => m.name)
      );
      
      // 5. Find and run new migrations
      const pendingMigrations = migrationFiles.filter(f => !appliedMigrations.has(f));
      
      if (pendingMigrations.length === 0) {
        console.log(`\n✅ All ${migrationFiles.length} migrations already applied`);
        return { success: true, applied: 0 };
      }
      
      console.log(`\n2. Found ${pendingMigrations.length} new migrations to apply`);
      
      // 6. Run migrations in transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        for (const file of pendingMigrations) {
          console.log(`\n   Applying: ${file}`);
          const migration = await import(join(MIGRATIONS_DIR, file));
          await migration.up(db);
          await db.run('INSERT INTO migrations (name) VALUES (?)', [file]);
          console.log(`   ✅ Applied`);
        }
        
        await db.run('COMMIT');
        console.log(`\n✅ Successfully applied ${pendingMigrations.length} migrations`);
        return { success: true, applied: pendingMigrations.length };
        
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
      
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    return { success: false, applied: 0, error: error.message };
  }
}

// Execute migrations
runMigrations()
  .then(({ success, applied, error }) => {
    if (success) {
      process.exit(0);
    } else {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unhandled error during migration:', error);
    process.exit(1);
  });
