import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

async function testDbSetup() {
  console.log('Testing database setup...');
  
  try {
    // 1. Check if database file exists
    const fs = await import('fs');
    const dbExists = fs.existsSync(dbPath);
    console.log(`Database file exists: ${dbExists}`);
    
    if (dbExists) {
      const stats = fs.statSync(dbPath);
      console.log(`Database size: ${stats.size} bytes`);
      console.log(`Permissions: ${(stats.mode & 0o777).toString(8)}`);
    }
    
    // 2. Try to open the database
    console.log('\nOpening database...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Successfully opened database');
    
    // 3. Check if migrations table exists
    console.log('\nChecking migrations table...');
    const migrationsTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'"
    );
    
    if (migrationsTable) {
      console.log('Migrations table exists');
      
      // 4. Check applied migrations
      const migrations = await db.all('SELECT * FROM migrations ORDER BY id');
      console.log('\nApplied migrations:');
      migrations.forEach(m => {
        console.log(`- ${m.id}: ${m.name} (applied at: ${new Date(m.applied_at * 1000).toISOString()})`);
      });
      
      // 5. Check expected tables
      console.log('\nChecking expected tables...');
      const expectedTables = ['user_tables', 'base_points'];
      
      for (const table of expectedTables) {
        const tableInfo = await db.get(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );
        
        if (tableInfo) {
          console.log(`✅ Table exists: ${table}`);
          
          // Show table structure
          const columns = await db.all(`PRAGMA table_info(${table})`);
          console.log(`  Columns: ${columns.map(c => c.name).join(', ')}`);
          
          // Show row count
          const count = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`  Row count: ${count.count}`);
          
          // Show first few rows if any
          if (count.count > 0) {
            const rows = await db.all(`SELECT * FROM ${table} LIMIT 3`);
            console.log('  Sample rows:', JSON.stringify(rows, null, 2));
          }
        } else {
          console.log(`❌ Table missing: ${table}`);
        }
      }
    } else {
      console.log('Migrations table does not exist');
    }
    
    await db.close();
  } catch (error) {
    console.error('Error during database test:', error);
  }
}

testDbSetup();
