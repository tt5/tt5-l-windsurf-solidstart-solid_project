import { Database } from 'sqlite3';

/**
 * Brief description of what this migration does
 * 
 * Detailed explanation of the changes and why they're needed.
 * Include any important notes or considerations for future reference.
 * 
 * Migration files should be named with the pattern: 00X_descriptive_name.ts
 * where X is the next sequential number
 */
export const description = 'Detailed description of the migration';

/**
 * Applies the migration
 * @param db Database instance
 */
export function up(db: Database) {
  // Always wrap in a transaction for safety
  const transaction = db.transaction(() => {
    // Your migration code here
    // Example:
    // db.exec(`
    //   CREATE TABLE example (
    //     id TEXT PRIMARY KEY,
    //     name TEXT NOT NULL,
    //     created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
    //     updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000),
    //     deleted_at_ms INTEGER
    //   );
    // `);
  });
  
  transaction();
}

/**
 * Reverts the migration
 * @param db Database instance
 */
export function down(db: Database) {
  // Implement rollback logic here
  // This is optional but recommended for development
  // Example:
  // db.exec('DROP TABLE IF EXISTS example;');
}

/**
 * Validates that the migration was applied correctly
 * @param db Database instance
 */
export function validate(db: Database) {
  // Optional: Add validation logic to verify the migration was successful
  // Example:
  // const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='example'").get();
  // if (!result) {
  //   throw new Error('Migration failed: table not created');
  // }
}

// For TypeScript module system
export default { description, up, down, validate };
