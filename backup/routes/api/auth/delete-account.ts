import { type APIEvent } from '@solidjs/start/server';
import { deleteUser } from '~/lib/server/db';

export async function POST({ request }: APIEvent) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response(JSON.stringify(
        { error: 'User ID is required' },
      ), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('Attempting to delete user account:', userId);
    const success = await deleteUser(userId);
    
    if (!success) {
      console.error('Failed to delete account for user:', userId);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete account',
          details: 'Please check server logs for more information'
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in delete-account:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
