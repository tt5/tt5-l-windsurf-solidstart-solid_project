import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'app.db');

console.log(`Checking database at: ${dbPath}`);

const db = new Database(dbPath, { readonly: true });

try {
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  
  // Check items table structure
  const itemsStructure = db.prepare('PRAGMA table_info(items)').all();
  console.log('Items table structure:', itemsStructure);
  
  // Check items data
  const items = db.prepare('SELECT * FROM items').all();
  console.log('Items data:', items);
} catch (error) {
  console.error('Error checking database:', error.message);
} finally {
  db.close();
}
