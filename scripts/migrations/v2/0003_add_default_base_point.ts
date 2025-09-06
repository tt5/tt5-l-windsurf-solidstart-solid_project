import { Database } from 'sqlite';

export const name = '0003_add_default_base_point';

export async function up(db: Database): Promise<void> {
  console.log('Checking for users to add default base point...');
  
  // Get all users
  const users = await db.all('SELECT id FROM users');
  
  if (users.length === 0) {
    console.log('No users found, skipping default base point creation');
    return;
  }
  
  let addedCount = 0;
  
  for (const user of users) {
    // Check if user already has base points
    const hasBasePoints = await db.get(
      'SELECT COUNT(*) as count FROM base_points WHERE user_id = ?',
      [user.id]
    );
    
    if (hasBasePoints && hasBasePoints.count === 0) {
      // Add default base point at (0,0)
      await db.run(
        'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
        [user.id]
      );
      addedCount++;
      console.log(`Added default base point for user: ${user.id}`);
    }
  }
  
  console.log(`Added default base points for ${addedCount} users`);
  console.log('Migration 0003_add_default_base_point completed successfully');
}

export async function down(db: Database): Promise<void> {
  console.log('Removing default base points...');
  await db.run("DELETE FROM base_points WHERE x = 0 AND y = 0");
  console.log('Rollback of 0003_add_default_base_point completed');
}
