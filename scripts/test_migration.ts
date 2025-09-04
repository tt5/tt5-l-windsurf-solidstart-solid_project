#!/usr/bin/env node
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(process.cwd(), 'data', 'test.db');

async function runMigration() {
  console.log('Starting migration test...');
  // Ensure directory exists
  await mkdir(dirname(DB_PATH), { recursive: true });
  
  console.log(`Opening database at: ${DB_PATH}`);
  
  // Create a new database connection
  const db = new Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
    
    console.log('Database opened successfully');
    
    // Set pragmas
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA foreign_keys = ON;');
      db.run('PRAGMA synchronous = NORMAL;');
      
      // Run the migration
      console.log('Running migration...');
      
      // Create migrations table
      db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        );
      `, function(err) {
        if (err) {
          console.error('Error creating migrations table:', err);
          db.close();
          return;
        }
        
        console.log('Migrations table created');
        
        // Create user_tables
        db.run(`
          CREATE TABLE IF NOT EXISTS user_tables (
            user_id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL UNIQUE,
            created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
            deleted_at_ms INTEGER
          );
        `, function(err) {
          if (err) {
            console.error('Error creating user_tables:', err);
            db.close();
            return;
          }
          
          console.log('user_tables table created');
          
          // Create indexes in series using chained callbacks
          db.run('CREATE INDEX IF NOT EXISTS idx_user_tables_user_id ON user_tables(user_id);', (err) => {
            if (err) {
              console.error('Error creating user_id index:', err);
              db.close();
              return;
            }
            
            console.log('Created user_id index');
            
            db.run('CREATE INDEX IF NOT EXISTS idx_user_tables_table_name ON user_tables(table_name);', (err) => {
              if (err) {
                console.error('Error creating table_name index:', err);
                db.close();
                return;
              }
              
              console.log('Created table_name index');
              
              db.run('INSERT INTO migrations (name) VALUES (?)', ['0001_initial_schema'], (err) => {
                if (err) {
                  console.error('Error recording migration:', err);
                  db.close();
                  return;
                }
                
                console.log('Recorded migration in migrations table');
                
                // List all tables
                db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
                  if (err) {
                    console.error('Error listing tables:', err);
                    db.close();
                    return;
                  }
                  
                  console.log('\nTables in database:');
                  console.log(tables);
                  
                  // Show migrations
                  db.all('SELECT * FROM migrations;', (err, migrations) => {
                    if (err) {
                      console.error('Error querying migrations:', err);
                    } else {
                      console.log('\nApplied migrations:');
                      console.log(migrations);
                    }
                    
                    // Close the database
                    console.log('\nClosing database connection');
                    db.close();
                  });
                });
              });
            });
          });
          });
        });
      });
    });
  });
}

runMigration().catch(console.error);
