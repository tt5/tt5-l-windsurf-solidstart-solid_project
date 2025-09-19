import type { APIEvent } from '@solidjs/start/server';
import { getDb } from '~/lib/server/db';
import { GameService } from '~/lib/server/services/game.service';
import { requireUser } from '~/lib/server/session';

// Response types
interface GameStatusResponse {
  success: boolean;
  gameJoined: boolean;
  homeX: number;
  homeY: number;
  message?: string;
  error?: string;
}

export async function GET({ request }: APIEvent) {
  // Check authentication
  const user = await requireUser(request);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      gameJoined: false,
      homeX: 0,
      homeY: 0,
      error: 'Unauthorized: You must be logged in to view game status'
    } as GameStatusResponse), { 
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const db = await getDb();
    const gameService = new GameService(db);
    
    // Get the current game status
    const status = await gameService.getGameStatus(user.id);
    
    // If no status is found, return default values
    if (!status) {
      return new Response(JSON.stringify({ 
        success: true,
        gameJoined: false,
        homeX: 0,
        homeY: 0,
        message: 'User has not joined the game yet'
      } as GameStatusResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Return the current status
    return new Response(JSON.stringify({
      success: true,
      gameJoined: status.gameJoined,
      homeX: status.homeX,
      homeY: status.homeY,
      message: status.gameJoined 
        ? `Your home base is at (${status.homeX}, ${status.homeY})`
        : 'You have not joined the game yet'
    } as GameStatusResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error in game status endpoint:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      gameJoined: false,
      homeX: 0,
      homeY: 0,
      error: 'An unexpected error occurred while fetching game status',
      message: 'Failed to load game status. Please try again.'
    } as GameStatusResponse), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
