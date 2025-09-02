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
  direction: Direction
): Promise<number[]> => {
  try {
    const borderIndices = getBorderIndices(direction);
    
    // Move existing squares
    const movedSquares = currentSquares
      .filter(i => canMove(i, direction))
      .map(i => moveIndex(i, direction));
    
    // Get 2-4 random border squares
    const randomCount = await getRandomCount(2, 4);
    const randomBorderSquares = getRandomIndices(borderIndices, randomCount);
    
    // Combine and remove duplicates
    return [...new Set([...movedSquares, ...randomBorderSquares])];
  } catch (error) {
    console.error(`Error in moveSquares (${direction}):`, error);
    return currentSquares;
  }
};

const getRandomCount = async (min: number, max: number): Promise<number> => {
  try {
    const response = await fetch(`/api/random?count=1&max=${max - min}`);
    if (!response.ok) throw new Error('Failed to fetch random numbers');
    const data = await response.json();
    return (data.numbers?.[0] ?? 0) + min;
  } catch (error) {
    console.error('Using fallback random count');
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

const getRandomIndices = (indices: number[], count: number): number[] => {
  const available = [...indices];
  const result: number[] = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    result.push(available.splice(randomIndex, 1)[0]);
  }
  
  return result;
};
