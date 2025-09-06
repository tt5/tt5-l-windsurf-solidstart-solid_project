export const up = async (db) => {
  console.log('Checking for users to add default base point...');
  
  // Get the first user from users table
  const user = await db.get('SELECT id as user_id FROM users LIMIT 1');
  
  if (!user) {
    console.log('No users found, skipping default base point creation');
    await markMigrationAsApplied(db);
    return;
  }
  
  // Check if user already has base points
  const hasBasePoints = await db.get(
    'SELECT COUNT(*) as count FROM base_points WHERE user_id = ?',
    [user.user_id]
  );
  
  if (hasBasePoints && hasBasePoints.count > 0) {
    console.log('User already has base points, skipping default base point creation');
    return await markMigrationAsApplied(db, '0003_add_default_base_point');
  }
      
  // Add default base point at (0,0)
  await db.run(
    'INSERT INTO base_points (user_id, x, y) VALUES (?, 0, 0)',
    [user.user_id]
  );
  
  console.log('Added default base point at (0,0) for user:', user.user_id);
  await markMigrationAsApplied(db, '0003_add_default_base_point');
}

async function markMigrationAsApplied(db, name) {
  try {
    await db.run(
      'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
      [name, Math.floor(Date.now() / 1000)]
    );
    console.log(`Marking migration as applied: ${name}`);
  } catch (error) {
    console.error(`Failed to mark migration ${name} as applied:`, error);
    throw error;
  }
}

export const down = async (db) => {
  console.log('Removing migration record...');
  await db.run('DELETE FROM migrations WHERE name = ?', ['0003_add_default_base_point']);
  console.log('Rollback of 0003_add_default_base_point completed');
};
