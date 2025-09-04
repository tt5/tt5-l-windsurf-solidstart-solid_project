import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMigrations() {
  const dbPath = path.join(process.cwd(), 'data', 'test-migrations.db');
  let db;
  
  try {
    // Remove test database if it exists
    try { await fs.unlink(dbPath); } catch {}
    
    console.log('Creating test database...');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Create migrations table
    console.log('Creating migrations table...');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);
    
    // Get migration files
    const migrationsDir = path.join(process.cwd(), 'scripts/migrations');
    console.log('Looking for migration files in:', migrationsDir);
    const files = await fs.readdir(migrationsDir);
    console.log('Found files:', files);
    
    const migrationFiles = files
      .filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'template.ts')
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Run migrations
    for (const file of migrationFiles) {
      const migrationName = file.replace(/\.ts$/, '');
      console.log(`\n=== Running migration: ${migrationName} ===`);
      
      // Import the migration module
      const migrationPath = path.resolve(path.join(migrationsDir, file));
      console.log('Importing migration from:', migrationPath);
      
      // Use dynamic import with file:// URL
      const fileUrl = new URL(`file://${migrationPath}`).href;
      const migration = await import(/* @vite-ignore */ fileUrl);
      
      if (!migration.up) {
        throw new Error(`Migration ${migrationName} is missing the 'up' function`);
      }
      
      // Run the migration
      console.log(`Executing migration: ${migrationName}`);
      await migration.up(db);
      
      // Mark migration as applied
      console.log(`Marking migration as applied: ${migrationName}`);
      await db.run('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
      
      console.log(`✅ Successfully applied migration: ${migrationName}`);
    }
    
    console.log('\nAll migrations completed successfully!');
    
    // Verify migrations were applied
    const appliedMigrations = await db.all('SELECT * FROM migrations ORDER BY name');
    console.log('\nApplied migrations:', appliedMigrations);
    
    // Verify tables were created
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    console.log('\nTables in database:', tables.map(t => t.name));
    
  } catch (error) {
    console.error('Migration test failed:', error);
    throw error;
  } finally {
    if (db) await db.close();
  }
}

testMigrations().catch(console.error);
