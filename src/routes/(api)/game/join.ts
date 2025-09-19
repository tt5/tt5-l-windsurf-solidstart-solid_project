import type { APIEvent } from '@solidjs/start/server';
import { getDb } from '~/lib/server/db';
import { GameService } from '~/lib/server/services/game.service';
import { requireUser } from '~/lib/server/session';

// Response types
interface JoinGameResponse {
  success: boolean;
  gameJoined: boolean;
  homeX: number;
  homeY: number;
  message?: string;
  error?: string;
}

export async function POST({ request }: APIEvent) {
  // Check authentication
  const user = await requireUser(request);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      gameJoined: false,
      homeX: 0,
      homeY: 0,
      error: 'Unauthorized: You must be logged in to join the game'
    } as JoinGameResponse), { 
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const db = await getDb();
    const gameService = new GameService(db);
    
    // Attempt to join the game
    const result = await gameService.joinGame(user.id);
    
    // Handle the result
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        gameJoined: result.gameJoined || false,
        homeX: result.homeX || 0,
        homeY: result.homeY || 0,
        message: result.message || 'Failed to join the game',
        error: result.message || 'Failed to join the game'
      } as JoinGameResponse), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      gameJoined: result.gameJoined,
      homeX: result.homeX,
      homeY: result.homeY,
      message: 'Successfully joined the game!'
    } as JoinGameResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error in join game endpoint:', error);
    
    return new Response(JSON.stringify({
      success: false,
      gameJoined: false,
      homeX: 0,
      homeY: 0,
      error: 'An unexpected error occurred while joining the game',
      message: 'An unexpected error occurred. Please try again.'
    } as JoinGameResponse), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
