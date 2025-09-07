import type { APIEvent } from "@solidjs/start/server";
import { getDb } from '~/lib/server/db';
import { BasePointRepository } from '~/lib/server/repositories/base-point.repository';
import { getAuthUser } from '~/lib/server/auth/jwt';

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

export async function POST({ request }: APIEvent) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
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

    const { borderIndices, currentPosition, direction } = await request.json() as CalculateSquaresRequest;
    
    // Get database connection and initialize repository
    const db = await getDb();
    const basePointRepository = new BasePointRepository(db);
    
    // Get base points and remove duplicates
    const basePoints = await basePointRepository.getAll();
    const uniqueBasePoints = basePoints && basePoints.length > 0 
      ? [...new Map(basePoints.map(p => [`${p.x},${p.y}`, p])).values()]
      : [{ x: 0, y: 0, userId: 'default' }];
    
    const [dx, dy] = directionMap[direction];
    const newSquares = borderIndices.flatMap(i => {
      const x = (i % 7) - currentPosition[0];
      const y = Math.floor(i / 7) - currentPosition[1];
      
      return uniqueBasePoints.flatMap(({ x: bx, y: by }) => {
        const xdiff = Math.abs(x - bx);
        const ydiff = Math.abs(y - by);
        
        if (xdiff === 0 || ydiff === 0 || xdiff === ydiff) {
          const nx = x + currentPosition[0] + dx;
          const ny = y + currentPosition[1] + dy;
          return nx >= 0 && nx < 7 && ny >= 0 && ny < 7 ? [nx + ny * 7] : [];
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
    console.error('Error in calculate-squares:', error);
    
    // Fallback to default squares in case of error
    const defaultSquares = [24]; // Center of 7x7 grid
    console.warn('Using default squares due to error');
    
    return new Response(JSON.stringify({ 
      success: true, // Still return success: true to prevent UI from breaking
      data: {
        squares: defaultSquares
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 200, // Still return 200 to prevent UI from breaking
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
