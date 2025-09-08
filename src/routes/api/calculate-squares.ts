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
    if (!Array.isArray(basePoints)) {
      throw new Error(`Expected basePoints to be an array, got ${typeof basePoints}`);
    }

    console.log("====")
    console.log(Date.now())
    console.log("borderIndices: ", borderIndices)
    console.log("currentPosition: ", currentPosition)
    console.log("direction: ", direction)
    console.log("====")

    const uniqueBasePoints = basePoints.length > 0 
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
          console.log(">>>", nx >= 0 && nx < 7 && ny >= 0 && ny < 7 ? [nx + ny * 7] : [])
          return nx >= 0 && nx < 7 && ny >= 0 && ny < 7 ? [nx + ny * 7] : [];
        }
        console.log("***", i)
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
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
