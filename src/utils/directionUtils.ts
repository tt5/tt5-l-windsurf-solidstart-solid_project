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
    
    // Get random numbers for each border index
    const randomNumbers = await getRandomNumbers(borderIndices.length, 1, 10);
    
    // Use all border indices with their corresponding random numbers
    const newSquares = borderIndices
      .map((index, i) => randomNumbers[i]);

    // Combine and remove duplicates
    return [...new Set([...movedSquares, ...newSquares])];
  } catch (error) {
    console.error(`Error in moveSquares (${direction}):`, error);
    return currentSquares;
  }
};

const getRandomNumbers = async (count: number, min: number, max: number): Promise<number[]> => {
  const response = await fetch(`/api/random?count=${count}&min=${min}&max=${max}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch random numbers: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.numbers || !Array.isArray(data.numbers)) {
    throw new Error('Invalid response format from random number service');
  }
  return data.numbers;
};