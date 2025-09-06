import type { APIEvent } from "@solidjs/start/server";
import { getBasePointRepository } from '~/lib/server/db';
import { getAuthUser } from '~/lib/server/auth/jwt';

type CalculateSquaresRequest = {
  borderIndices: number[];
  currentPosition: [number, number];
  direction: 'up' | 'down' | 'left' | 'right';
};

const directionMap = {
  'up': [0, -1],
  'down': [0, 1],
  'right': [1, 0],
  'left': [-1, 0]
} as const;

export async function POST({ request }: APIEvent) {
  try {
    // Verify authentication
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized access attempt to /api/calculate-squares');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication required' 
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData = await request.json() as CalculateSquaresRequest;
    const { borderIndices, currentPosition, direction } = requestData;
    
    console.log('=== Calculate Squares API Request ===');
    console.log('Input:', {
      borderIndices,
      currentPosition,
      direction,
      requestData
    });
    
    // Get all base points from the database and remove duplicates
    const basePointRepository = await getBasePointRepository();
    let basePoints = await basePointRepository.getAll();
    console.log('Retrieved base points from DB:', basePoints);
    
    // Remove duplicate base points (same x, y coordinates)
    const uniqueBasePoints = [
      ...new Map(
        basePoints.map(point => [`${point.x},${point.y}`, point])
      ).values()
    ];
    
    // Fallback to default if no base points exist
    if (uniqueBasePoints.length === 0) {
      uniqueBasePoints.push({ x: 0, y: 0, userId: 'default' });
    }

    const borderCoordinates = borderIndices.map(i => 
      [(i % 7) - currentPosition[0], Math.floor(i / 7) - currentPosition[1]]
    );
    
    console.log('Calculated border coordinates:', borderCoordinates);
    
    // Convert base points to array of [x, y] arrays
    const basePointCoords = uniqueBasePoints.map(p => [p.x, p.y]);
    console.log('Base point coordinates:', basePointCoords);

    const [dx, dy] = directionMap[direction];

    const result = (x: number, y: number) => 
      (x + currentPosition[0] + dx) + (y + currentPosition[1] + dy) * 7;
    
    const newSquares = borderCoordinates.flatMap(
      ([x,y]) => basePointCoords.map(([i,j]) => {
        let xdiff = Math.abs(x - i);
        let ydiff = Math.abs(y - j);
        if (xdiff >= ydiff) [xdiff, ydiff] = [ydiff, xdiff];
        if (xdiff === 0 || ydiff === 0 || xdiff === ydiff) return result(x, y);
        if (xdiff > 0 && ydiff % xdiff === 0) return result(x, y);
        return -1;
      }).filter((n): n is number => n !== -1)
    );

    const resultSquares = [...new Set(newSquares)];
    
    console.log('=== Calculate Squares API Response ===');
    console.log('Result squares:', resultSquares);
    console.log('Total squares:', resultSquares.length);
    
    return new Response(JSON.stringify({ 
      squares: resultSquares 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error calculating squares:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate squares' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
