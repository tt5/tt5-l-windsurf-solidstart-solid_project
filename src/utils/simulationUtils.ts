import { BOARD_CONFIG } from '~/constants/game';
import { BasePoint } from '~/types/board';

type Direction = 'up' | 'down' | 'left' | 'right';

// The directionMap is kept for potential future use with direction-based calculations
// Currently, direction is only used to determine which border to calculate
const directionMap = {
  'up': [0, 0],
  'down': [0, 0],
  'right': [0, 0],
  'left': [0, 0]
} as const;

export async function calculateRestrictedSquaresForSimulation(
  borderIndices: number[],
  currentPosition: [number, number],
  direction: Direction
): Promise<number[]> {
  try {
    // Get database connection and initialize repository
    const { getDb } = await import('~/lib/server/db');
    const { BasePointRepository } = await import('~/lib/server/repositories/base-point.repository');
    
    const db = await getDb();
    const basePointRepository = new BasePointRepository(db);
    
    // Get base points and remove duplicates
    const basePoints = await basePointRepository.getAll();
    if (!Array.isArray(basePoints)) {
      throw new Error(`Expected basePoints to be an array, got ${typeof basePoints}`);
    }

    const uniqueBasePoints = basePoints.length > 0 
      ? [...new Map(basePoints.map(p => [`${p.x},${p.y}`, p])).values()]
      : [];
    
    const [dx, dy] = directionMap[direction];
    
    const newSquares = borderIndices.flatMap((i) => {
      const x = (i % BOARD_CONFIG.GRID_SIZE) - currentPosition[0];
      const y = Math.floor(i / BOARD_CONFIG.GRID_SIZE) - currentPosition[1];
      
      return uniqueBasePoints.flatMap(({ x: bx, y: by }) => {
        if (bx === x && by === y) return [];
        const xdiff = Math.abs(x - bx);
        const ydiff = Math.abs(y - by);
        
        // Check for straight lines (horizontal/vertical/diagonal) or specific slopes
        if (xdiff === 0 || ydiff === 0 || xdiff === ydiff
          || (2 * xdiff === ydiff) || (2 * ydiff === xdiff)
          || (3 * xdiff === ydiff) || (3 * ydiff === xdiff)
          || (5 * xdiff === ydiff) || (5 * ydiff === xdiff)
          ) {
          const nx = x + currentPosition[0] + dx;
          const ny = y + currentPosition[1] + dy;
          
          return nx >= 0 && nx < BOARD_CONFIG.GRID_SIZE && ny >= 0 && ny < BOARD_CONFIG.GRID_SIZE 
            ? [nx + ny * BOARD_CONFIG.GRID_SIZE] 
            : [];
        }
        return [];
      });
    });
    
    // Filter to only include squares that are in both newSquares and borderIndices
    const borderIndicesSet = new Set(borderIndices);
    return [...new Set(newSquares)].filter(square => borderIndicesSet.has(square));
    
  } catch (error) {
    console.error('Error in calculateRestrictedSquaresForSimulation:', error);
    return [];
  }
}
