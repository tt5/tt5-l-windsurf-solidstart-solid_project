import { eventHandler, createError } from 'h3';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default eventHandler(async (event) => {
  try {
    // Simple SQLite test
    const db = await open({
      filename: 'data/app.db',
      driver: sqlite3.Database
    });
    
    // Test query
    const result = await db.get('SELECT 1 as test');
    await db.close();
    
    return { 
      status: "success", 
      message: "Database connection successful",
      testResult: result
    };
  } catch (error) {
    console.error('Database test failed:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Database connection failed',
      data: {
        error: error.message
      }
    });
  }
});
