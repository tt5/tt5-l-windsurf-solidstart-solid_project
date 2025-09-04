import { initializeServer } from '~/lib/server/init';

export async function GET() {
  try {
    // Initialize the database
    await initializeServer();
    
    return new Response(JSON.stringify({ 
      status: 'success', 
      message: 'Database initialized successfully' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Database initialization failed',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
