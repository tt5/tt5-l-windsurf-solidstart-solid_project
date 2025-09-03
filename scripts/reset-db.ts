#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { 
  createDatabaseConnection, 
  databaseExists,
  backupDatabase, 
  ensureDbDirectory,
  Database
} from './utils/db-utils.js';
import { PATHS } from './utils/paths.js';
import { readFile } from 'node:fs/promises';
import { unlink } from 'node:fs/promises';

async function resetDatabase() {
  const dbPath = PATHS.DB;
  let db: Database.Database | null = null;
  
  try {
    console.log('🔄 Resetting database...');
    
    // Create backup of existing database if it exists
    if (await databaseExists()) {
      const backupPath = await backupDatabase();
      console.log(`✅ Backed up existing database to ${backupPath}`);
      
      // Close any existing connections and remove the file
      try {
        if (db) db.close();
        await unlink(dbPath);
      } catch (error) {
        console.warn('⚠️  Could not remove existing database file, will continue anyway:', error);
      }
    }

    // Ensure directory exists
    await ensureDbDirectory();

    // Create new database connection
    db = createDatabaseConnection();
    
    try {
      // Configure database
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('synchronous = NORMAL');
      db.pragma('temp_store = MEMORY');

      // Read and execute schema
      console.log('📝 Creating database tables...');
      const schema = await readFile(PATHS.SCHEMA_FILE, 'utf-8');
      db.exec(schema);

      console.log('✅ Database reset successfully!');
      console.log(`🔗 New database created at: ${dbPath}`);
      return true;
    } finally {
      if (db) db.close();
    }
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    return false;
  }
}

// Run the reset
resetDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
// Run the reset if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  resetDatabase().catch(console.error);
}

export { resetDatabase };
