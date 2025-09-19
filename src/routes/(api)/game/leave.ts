import { APIEvent, json } from 'solid-start';
import { getDb } from '~/lib/server/db';
import { GameService } from '~/lib/server/services/game.service';
import { requireUser } from '~/lib/server/session';

// Response types
interface LeaveGameResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST({ request }: APIEvent) {
  // Check authentication
  const user = await requireUser(request);
  if (!user) {
    return json<LeaveGameResponse>({
      success: false,
      error: 'Unauthorized: You must be logged in to leave the game'
    }, { status: 401 });
  }

  try {
    const db = await getDb();
    const gameService = new GameService(db);
    
    // Attempt to leave the game
    const result = await gameService.leaveGame(user.id);
    
    // Handle the result
    if (!result.success) {
      return json<LeaveGameResponse>({
        success: false,
        message: result.message || 'Failed to leave the game',
        error: result.message || 'Failed to leave the game'
      }, { status: 400 });
    }
    
    // Return success response
    return json<LeaveGameResponse>({
      success: true,
      message: 'Successfully left the game. Your base remains on the map.'
    });
    
  } catch (error) {
    console.error('Error in leave game endpoint:', error);
    
    return json<LeaveGameResponse>({
      success: false,
      error: 'An unexpected error occurred while leaving the game',
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 });
  }
}
