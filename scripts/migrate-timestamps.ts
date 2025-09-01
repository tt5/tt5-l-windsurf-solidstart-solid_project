import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'app.db');
const db = new Database(dbPath);

// Add new column for millisecond timestamps
db.exec(`
  ALTER TABLE items ADD COLUMN created_at_ms INTEGER;
`);

// Update existing rows with millisecond precision
const updateStmt = db.prepare(`
  UPDATE items 
  SET created_at_ms = (julianday(created_at) * 86400000)
  WHERE created_at_ms IS NULL;
`);

// Create a transaction to ensure data consistency
db.transaction(() => {
  updateStmt.run();
  console.log('Migration completed successfully');
})();

db.close();
