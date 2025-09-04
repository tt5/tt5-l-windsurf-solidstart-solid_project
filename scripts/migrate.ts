import { getDb, runMigrations } from '../src/lib/server/db';

async function main() {
  try {
    console.log('Running migrations...');
    const db = await getDb();
    await runMigrations();
    console.log('Migrations completed successfully!');
    
    // Verify migrations were applied
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    console.log('\nDatabase tables:');
    console.table(tables);
    
    const appliedMigrations = await db.all('SELECT * FROM migrations');
    console.log('\nApplied migrations:');
    console.table(appliedMigrations);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
