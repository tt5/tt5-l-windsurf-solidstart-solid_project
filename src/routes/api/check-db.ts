import { APIEvent } from '@solidjs/start/server';
import { getDb } from '~/lib/server/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Check if users table exists
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    
    // Check if users table exists
    const usersTableExists = tableNames.includes('users');
    
    // Get user count
    let userCount = 0;
    if (usersTableExists) {
      const result = await db.get('SELECT COUNT(*) as count FROM users');
      userCount = result?.count || 0;
    }
    
    // Check if user_tables exists
    const userTablesExists = tableNames.includes('user_tables');
    
    // Get user_tables count
    let userTablesCount = 0;
    if (userTablesExists) {
      const result = await db.get('SELECT COUNT(*) as count FROM user_tables');
      userTablesCount = result?.count || 0;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        databasePath: '/home/n/data/l/windsurf/solidstart/solid-project/data/app.db',
        tables: tableNames,
        usersTable: {
          exists: usersTableExists,
          count: userCount
        },
        userTables: {
          exists: userTablesExists,
          count: userTablesCount
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('Error checking database:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
