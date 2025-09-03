#!/usr/bin/env node
import { Command } from 'commander';
import { createDatabaseConnection, ensureDbDirectory, backupDatabase, databaseExists } from './core/db.js';
import { runMigrations } from './core/migrate.js';

const program = new Command();

program
  .name('db')
  .description('Database management CLI')
  .version('1.0.0');

// Initialize database
program
  .command('init')
  .description('Initialize a new database')
  .action(async () => {
    try {
      await ensureDbDirectory();
      const db = await createDatabaseConnection();
      console.log('✅ Database initialized successfully');
      db.close();
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      process.exit(1);
    }
  });

// Run migrations
program
  .command('migrate')
  .description('Run pending database migrations')
  .action(async () => {
    try {
      await ensureDbDirectory();
      await runMigrations();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

// Backup database
program
  .command('backup')
  .description('Create a backup of the database')
  .action(async () => {
    try {
      await ensureDbDirectory();
      if (!await databaseExists()) {
        console.error('❌ Database does not exist');
        process.exit(1);
      }
      const backupPath = await backupDatabase();
      console.log(`✅ Backup created at: ${backupPath}`);
    } catch (error) {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    }
  });

// Check database status
program
  .command('status')
  .description('Check database status')
  .action(async () => {
    try {
      await ensureDbDirectory();
      const exists = await databaseExists();
      if (!exists) {
        console.log('❌ Database does not exist');
        return;
      }

      const db = await createDatabaseConnection();
      
      try {
        // Get database info
        const stats = await import('node:fs').then(fs => fs.statSync(db.name));
        console.log(`🔍 Database: ${db.name}`);
        console.log(`💾 Size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        // Get table info
        const tables = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).all() as { name: string }[];
        
        console.log(`\n📊 Tables (${tables.length}):`);
        
        for (const { name } of tables) {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get() as { count: number };
          console.log(`- ${name}: ${count.count} rows`);
        }
        
        // Check migrations
        try {
          const migrations = db.prepare('SELECT COUNT(*) as count FROM migrations').get() as { count: number };
          console.log(`\n🔄 Applied migrations: ${migrations.count}`);
        } catch {
          console.log('\n⚠️  Migrations table not found');
        }
        
      } finally {
        db.close();
      }
      
    } catch (error) {
      console.error('❌ Error checking database status:', error);
      process.exit(1);
    }
  });

// Reset database (DANGEROUS!)
program
  .command('reset')
  .description('Reset the database (DANGEROUS!)')
  .option('--force', 'Skip confirmation')
  .action(async (options) => {
    try {
      if (!options.force) {
        const readline = await import('node:readline/promises');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await rl.question('⚠️  This will delete all data. Are you sure? (y/N) ');
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.log('Operation cancelled');
          return;
        }
      }
      
      console.log('🔄 Resetting database...');
      
      // Backup existing database
      if (await databaseExists()) {
        const backupPath = await backupDatabase();
        console.log(`💾 Created backup at: ${backupPath}`);
        
        // Close any existing connections
        try {
          const { unlink } = await import('node:fs/promises');
          await unlink(db.name);
        } catch (error) {
          console.error('❌ Failed to delete database file:', error);
          process.exit(1);
        }
      }
      
      // Initialize new database
      await ensureDbDirectory();
      const db = await createDatabaseConnection();
      
      try {
        // Create migrations table
        const { ensureMigrationsTable } = await import('./core/migrate.js');
        await ensureMigrationsTable(db);
        
        console.log('✅ Database reset successfully');
        console.log('\nRun `npm run db:migrate` to apply migrations');
        
      } finally {
        db.close();
      }
      
    } catch (error) {
      console.error('❌ Reset failed:', error);
      process.exit(1);
    }
  });

// Show help if no arguments
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);
