// Border indices for the 7x7 grid
const BORDERS = {
  TOP: [0, 1, 2, 3, 4, 5, 6],
  BOTTOM: [42, 43, 44, 45, 46, 47, 48],
  LEFT: [0, 7, 14, 21, 28, 35, 42],
  RIGHT: [6, 13, 20, 27, 34, 41, 48]
} as const;

type Direction = 'up' | 'down' | 'left' | 'right';

const getBorderIndices = (direction: Direction): number[] => {
  switch (direction) {
    case 'up': return BORDERS.BOTTOM;
    case 'down': return BORDERS.TOP;
    case 'left': return BORDERS.RIGHT;
    case 'right': return BORDERS.LEFT;
  }
};

const canMove = (index: number, direction: Direction): boolean => {
  switch (direction) {
    case 'up': return index >= 7;
    case 'down': return index < 42;
    case 'left': return index % 7 !== 0;
    case 'right': return index % 7 !== 6;
  }
};

const moveIndex = (index: number, direction: Direction): number => {
  switch (direction) {
    case 'up': return index - 7;
    case 'down': return index + 7;
    case 'left': return index - 1;
    case 'right': return index + 1;
  }
};

export const moveSquares = async (
  currentSquares: number[],
  direction: Direction,
  currentPosition: [number, number]
): Promise<number[]> => {
  try {
    const borderIndices = getBorderIndices(direction);

    const borderCoordinates = borderIndices.map(i => 
      [(i % 7) - currentPosition[0], Math.floor(i / 7) - currentPosition[1]]
    );

    console.log("pos: ", currentPosition, "direction: ", direction)

    const directionMap: Record<Direction, [number, number]> = {
      'up': [0, -1],
      'down': [0, 1],
      'right': [1, 0],
      'left': [-1, 0]
    };

    const [x, y] = directionMap[direction];

    
    // Move existing squares
    const movedSquares = currentSquares
      .filter(i => canMove(i, direction))
      .map(i => moveIndex(i, direction));
    
    // Get base points for each border index
    const basePoints = await getBasePoints(borderIndices.length);

    const result = (x: number, y: number) => {

          return ((x + currentPosition[0] + directionMap[direction][0])
          + (y + currentPosition[1] + directionMap[direction][1]) * 7)
      
    }
    
    const newSquares = borderCoordinates.flatMap(
      ([x,y]) => basePoints.map(([i,j]) => {
        let xdiff = Math.abs(x - i);
        let ydiff = Math.abs(y - j);
        if (xdiff >= ydiff) {
          const temp = xdiff;
          xdiff = ydiff;
          ydiff = temp;
        }
        if (ydiff === 0) {
          return result(x,y)
        }
        if (xdiff === ydiff) {
          return result(x,y)
        }
        if (xdiff === 0) {
          return result(x,y)
        }
        const isit = ydiff % xdiff;
        if (isit === 0) {
          return result(x,y);
        }
        return -1;
      }).filter((n): n is number => n !== -1)
    );

    // Combine and remove duplicates
    return [...new Set([...movedSquares, ...newSquares])];
  } catch (error) {
    console.error(`Error in moveSquares (${direction}):`, error);
    return currentSquares;
  }
};

type BasePoint = [number, number]; // [x, y] coordinates

const getBasePoints = async (count: number): Promise<BasePoint[]> => {
  const response = await fetch(`/api/random-base-points?count=${count}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch base points: ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.basePoints)) {
    throw new Error('Invalid response format from base points service');
  }
  return data.basePoints;
};