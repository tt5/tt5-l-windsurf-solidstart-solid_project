import { Database } from 'sqlite';

export const name = '20250919_165027_add_game_join_status_and_home_position_to_users';

export async function up(db: Database): Promise<void> {
  // Add game_joined column with default false
  await db.exec(`
    ALTER TABLE users
    ADD COLUMN game_joined BOOLEAN NOT NULL DEFAULT 0
  `);

  // Add home_x column with default 0
  await db.exec(`
    ALTER TABLE users
    ADD COLUMN home_x INTEGER NOT NULL DEFAULT 0
  `);

  // Add home_y column with default 0
  await db.exec(`
    ALTER TABLE users
    ADD COLUMN home_y INTEGER NOT NULL DEFAULT 0
  `);
}

export async function down(db: Database): Promise<void> {
  // Drop the added columns
  await db.exec('ALTER TABLE users DROP COLUMN game_joined');
  await db.exec('ALTER TABLE users DROP COLUMN home_x');
  await db.exec('ALTER TABLE users DROP COLUMN home_y');
}