import { Database } from 'sqlite';

export const name = '0003_add_default_base_point';

export async function up(db: Database): Promise<void> {
  console.log('Checking for users to add default base point...');
  
  // Get the first user from user_tables
  const user = await db.get<{user_id: string}>('SELECT user_id FROM user_tables LIMIT 1');
  
  if (!user) {
    console.log('No users found, skipping default base point creation');
    await markMigrationAsApplied(db);
    return;
  }
  
  // Check if user already has base points
  const hasBasePoints = await db.get<{count: number}>(
    'SELECT COUNT(*) as count FROM base_points WHERE user_id = ?',
    [user.user_id]
  );
  
  if (hasBasePoints && hasBasePoints.count > 0) {
    console.log('User already has base points, skipping default base point creation');
    await markMigrationAsApplied(db);
    return;
  }
      
  // Add default base point at (0,0)
  await db.run(
    'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
    [user.user_id]
  );
  
  console.log('Added default base point at (0,0) for user:', user.user_id);
  await markMigrationAsApplied(db);
}

async function markMigrationAsApplied(db: Database): Promise<void> {
  try {
    await db.run('INSERT INTO migrations (name) VALUES (?)', [name]);
    console.log(`Migration ${name} completed successfully`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      console.log('Migration already applied, skipping...');
    } else {
      throw error;
    }
  }
}

export async function down(db: Database): Promise<void> {
  console.log('Removing default base points...');
  await db.run('DELETE FROM base_points WHERE x = 0 AND y = 0');
  
  console.log('Removing migration record...');
  await db.run('DELETE FROM migrations WHERE name = ?', [name]);
  console.log('Rollback of 0003_add_default_base_point completed');
}
