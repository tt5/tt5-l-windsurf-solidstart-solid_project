import type { APIEvent } from "@solidjs/start/server";

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
    const { borderIndices, currentPosition, direction } = await request.json() as CalculateSquaresRequest;
    
    const borderCoordinates = borderIndices.map(i => 
      [(i % 7) - currentPosition[0], Math.floor(i / 7) - currentPosition[1]]
    );

    let basePoints = [
      [0,0],
    ]

    const [dx, dy] = directionMap[direction];

    const result = (x: number, y: number) => 
      (x + currentPosition[0] + dx) + (y + currentPosition[1] + dy) * 7;
    
    const newSquares = borderCoordinates.flatMap(
      ([x,y]) => basePoints.map(([i,j]) => {
        let xdiff = Math.abs(x - i);
        let ydiff = Math.abs(y - j);
        if (xdiff >= ydiff) [xdiff, ydiff] = [ydiff, xdiff];
        if (xdiff === 0 || ydiff === 0 || xdiff === ydiff) return result(x, y);
        if (xdiff > 0 && ydiff % xdiff === 0) return result(x, y);
        return -1;
      }).filter((n): n is number => n !== -1)
    );

    return new Response(JSON.stringify({ 
      squares: [...new Set(newSquares)] 
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
