import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function updatePragmas() {
  const dbPath = join(process.cwd(), 'data', 'app.db');
  
  if (!await fs.access(dbPath).then(() => true).catch(() => false)) {
    console.log('❌ Database file not found. Please run reset-db.ts first.');
    return;
  }

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE
  });

  try {
    // Set all pragmas using exec
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA temp_store = MEMORY;');
    
    console.log('✅ Database pragmas updated successfully!');
  } catch (error) {
    console.error('❌ Error updating database pragmas:', error);
  } finally {
    await db.close();
  }
}

// Run the update if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updatePragmas().catch(console.error);
}

export { updatePragmas };
