import type { APIEvent } from '@solidjs/start/server';
import { getDb } from '~/lib/server/db';
import { GameService } from '~/lib/server/services/game.service';
import { requireUser } from '~/lib/server/session';

// Response types
interface LeaveGameResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(event: APIEvent) {
  const { request } = event;
  // Check authentication
  const user = await requireUser(event);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized: You must be logged in to leave the game'
    } as LeaveGameResponse), { 
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const db = await getDb();
    const gameService = new GameService(db);
    
    // Attempt to leave the game
    const result = await gameService.leaveGame(user.id);
    
    // Handle the result
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        message: result.message || 'Failed to leave the game',
        error: result.message || 'Failed to leave the game'
      } as LeaveGameResponse), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully left the game. Your base remains on the map.'
    } as LeaveGameResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error in leave game endpoint:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'An unexpected error occurred while leaving the game',
      message: 'An unexpected error occurred. Please try again.'
    } as LeaveGameResponse), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
