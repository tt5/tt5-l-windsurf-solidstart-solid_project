#!/usr/bin/env node
import { PATHS, SCHEMA } from './config.js';
import Database from 'better-sqlite3';
import { access, constants } from 'node:fs/promises';

interface TableInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

async function checkDatabase() {
  try {
    // Check if database exists
    try {
      await access(PATHS.DB, constants.R_OK);
      console.log(`🔍 Found database at: ${PATHS.DB}`);
    } catch {
      console.error(`❌ Database not found at ${PATHS.DB}`);
      return false;
    }

    const db = new Database(PATHS.DB, { readonly: true });
    
    try {
      // Get database info
      const stats = await import('node:fs').then(fs => fs.statSync(PATHS.DB));
      console.log(`💾 Database size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      // Check tables
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all() as { name: string }[];
      
      console.log(`\n📊 Found ${tables.length} tables:`);
      
      for (const { name } of tables) {
        console.log(`\nTable: ${name}`);
        
        // Get table info
        const tableInfo = db.prepare<TableInfo>(
          `PRAGMA table_info(${name})`
        ).all();
        
        console.log('  Columns:');
        for (const col of tableInfo) {
          console.log(`    - ${col.name} (${col.type})${col.pk ? ' [PK]' : ''}${col.notnull ? ' NOT NULL' : ''}`);
        }
        
        // Get row count
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get() as { count: number };
          console.log(`  Rows: ${count.count.toLocaleString()}`);
          
          // Show sample data for non-system tables
          if (!name.startsWith('_') && count.count > 0) {
            const sample = db.prepare(
              `SELECT * FROM ${name} ORDER BY RANDOM() LIMIT 3`
            ).all();
            
            if (sample.length > 0) {
              console.log('  Sample data:');
              console.log(JSON.stringify(sample, null, 2));
            }
          }
        } catch (error) {
          console.log('  Could not read table data:', error.message);
        }
      }
      
      // Check for pending migrations
      const migrationsTable = tables.some(t => t.name === '_migrations');
      if (migrationsTable) {
        const appliedMigrations = db.prepare(
          'SELECT name FROM _migrations ORDER BY executed_at'
        ).all() as { name: string }[];
        
        console.log('\n🔄 Applied migrations:');
        if (appliedMigrations.length > 0) {
          appliedMigrations.forEach((m, i) => 
            console.log(`  ${i + 1}. ${m.name}`)
          );
        } else {
          console.log('  No migrations have been applied yet');
        }
      } else {
        console.log('\n⚠️  No migration tracking found (missing _migrations table)');
      }
      
      return true;
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return false;
  }
}

// Run the check
checkDatabase().then(success => {
  process.exit(success ? 0 : 1);
});
