import { createDatabaseConnection, DB_PATH } from './core/db.js';
import { access, constants } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function checkDb() {
  try {
    console.log('Checking database file...');
    try {
      await access(DB_PATH, constants.F_OK);
      console.log(`✅ Database file exists at: ${DB_PATH}`);
    } catch (err) {
      console.error(`❌ Database file not found at: ${DB_PATH}`);
      console.error('Please run `npm run db:init` first');
      return;
    }

    console.log('\nConnecting to database...');
    const db = await createDatabaseConnection();
    
    try {
      // Get all tables
      console.log('\nTables in database:');
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      console.log(tables.map(t => `- ${t.name}`).join('\n'));
      
      // Check each table
      for (const table of tables) {
        console.log(`\nTable: ${table.name}`);
        
        // Show schema
        const schema = await db.all(`PRAGMA table_info(${table.name})`);
        console.log('Schema:');
        console.table(schema);
        
        // Show first few rows
        try {
          const rows = await db.all(`SELECT * FROM ${table.name} LIMIT 5`);
          console.log(`Data (first ${rows.length} rows):`);
          if (rows.length > 0) {
            console.table(rows);
          } else {
            console.log('  (empty table)');
          }
        } catch (err) {
          console.error(`  Error reading data from ${table.name}:`, err.message);
        }
      }
      
      // Check database integrity
      console.log('\nDatabase integrity check:');
      const integrity = await db.get("PRAGMA integrity_check");
      console.log(integrity);
      
    } catch (err) {
      console.error('\nError querying database:', err);
    } finally {
      await db.close();
    }
    
  } catch (error) {
    console.error('\nFatal error:', error);
  }
}

checkDb();
