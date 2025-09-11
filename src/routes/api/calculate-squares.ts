import { getDb } from '~/lib/server/db';
import { BasePointRepository } from '~/lib/server/repositories/base-point.repository';
import { withAuth } from '~/middleware/auth';
import { createErrorResponse, generateRequestId } from '~/utils/api';
import { BOARD_CONFIG } from '~/constants/game';

type CalculateSquaresRequest = {
  borderIndices: number[];
  currentPosition: [number, number];
  direction: 'up' | 'down' | 'left' | 'right';
};

const directionMap = {
  'up': [0, 0],
  'down': [0, 0],
  'right': [0, 0],
  'left': [0, 0]
} as const;

export const POST = withAuth(async ({ request, user }) => {
  const requestId = generateRequestId();
  
  try {
    const { borderIndices, currentPosition, direction } = await request.json() as CalculateSquaresRequest;
    
    // Get database connection and initialize repository
    const db = await getDb();
    const basePointRepository = new BasePointRepository(db);
    
    // Get base points and remove duplicates
    const basePoints = await basePointRepository.getAll();
    if (!Array.isArray(basePoints)) {
      throw new Error(`Expected basePoints to be an array, got ${typeof basePoints}`);
    }

    /*
    console.log("====")
    console.log(Date.now())
    console.log("borderIndices: ", borderIndices)
    console.log("currentPosition: ", currentPosition)
    console.log("direction: ", direction)
    console.log("====")
    */

    const uniqueBasePoints = basePoints.length > 0 
      ? [...new Map(basePoints.map(p => [`${p.x},${p.y}`, p])).values()]
      : [{ x: 0, y: 0, userId: 'default' }];
    
    const [dx, dy] = directionMap[direction];
    const newSquares = borderIndices.flatMap((i, index) => {
      const x = (i % BOARD_CONFIG.GRID_SIZE) - currentPosition[0];
      const y = Math.floor(i / BOARD_CONFIG.GRID_SIZE) - currentPosition[1];
      
      return uniqueBasePoints.flatMap(({ x: bx, y: by }) => {
        if (bx === x && by === y) return [];
        const xdiff = Math.abs(x - bx);
        const ydiff = Math.abs(y - by);
        
        // Check for straight lines (horizontal/vertical/diagonal) or slopes 2:1 and 1:2
        if (xdiff === 0 || ydiff === 0 || xdiff === ydiff || 
            (xdiff === ydiff / 2) || (ydiff === xdiff / 2)) {
          const nx = x + currentPosition[0] + dx;
          const ny = y + currentPosition[1] + dy;
          
            // Original logic for straight lines and diagonals
            return nx >= 0 && nx < BOARD_CONFIG.GRID_SIZE && ny >= 0 && ny < BOARD_CONFIG.GRID_SIZE 
              ? [nx + ny * BOARD_CONFIG.GRID_SIZE] 
              : [];
        }
        return [];
      });
    });
    
    return new Response(JSON.stringify({ 
      success: true,
      data: {
        squares: [...new Set(newSquares)]
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error(`[${requestId}] Error in calculate-squares:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse('Failed to calculate squares', 500, errorMessage, { requestId });
  }
});
