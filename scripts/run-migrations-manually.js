import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

// List of migrations in order
const MIGRATIONS = [
  '0001_initial_schema',
  '0002_add_base_points',
  '0003_add_default_base_point'
];

async function runMigrations() {
  console.log('Starting manual migrations...');
  
  // Ensure data directory exists
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  
  // Open database
  console.log('Opening database...');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // Create migrations table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Get applied migrations
    const appliedMigrations = new Set(
      (await db.all('SELECT name FROM migrations')).map(m => m.name)
    );
    
    console.log(`Found ${appliedMigrations.size} applied migrations`);
    
    // Run pending migrations
    for (const migrationName of MIGRATIONS) {
      if (!appliedMigrations.has(migrationName)) {
        console.log(`\n=== Running migration: ${migrationName} ===`);
        
        try {
          // Import the migration module
          const migration = await import(`./migrations/${migrationName}.js`);
          
          // Run the migration
          await migration.up(db);
          
          // Mark as applied
          await db.run('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
          console.log(`✅ Successfully applied migration: ${migrationName}`);
        } catch (error) {
          console.error(`❌ Failed to apply migration ${migrationName}:`, error);
          throw error;
        }
      } else {
        console.log(`✓ Migration already applied: ${migrationName}`);
      }
    }
    
    console.log('\nAll migrations completed successfully!');
  } finally {
    await db.close();
  }
}

runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
