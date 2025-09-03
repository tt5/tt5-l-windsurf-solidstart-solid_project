import { Database } from 'better-sqlite3';

// This is a template for new migrations
// Rename this file to follow the pattern: 00X_short_description.ts
// where X is the next sequential number

export const description = 'Short description of what this migration does';

export function up(db: Database) {
  // Add your migration logic here
  // Example:
  // db.exec(`
  //   CREATE TABLE IF NOT EXISTS new_table (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT NOT NULL,
  //     created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') * 1000) % 1000)
  //   );
  // `);
}

export function down(db: Database) {
  // Add rollback logic here
  // This is optional but recommended
  // Example:
  // db.exec('DROP TABLE IF EXISTS new_table;');
}

// For TypeScript module system
export default { description, up, down };
