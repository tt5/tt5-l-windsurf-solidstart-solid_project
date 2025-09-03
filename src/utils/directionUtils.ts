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
    // Get border indices (indices on the edge of the 7x7 grid)
    const borderIndices = [];
    for (let i = 0; i < 7; i++) {
      // Top and bottom rows
      borderIndices.push(i);
      borderIndices.push(42 + i);
    }
    for (let i = 1; i < 6; i++) {
      // Left and right columns (excluding corners already added)
      borderIndices.push(i * 7);
      borderIndices.push(i * 7 + 6);
    }

    // Call the server to calculate new squares
    const response = await fetch('/api/calculate-squares', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        borderIndices,
        currentPosition,
        direction
      })
    });

    if (!response.ok) {
      throw new Error('Failed to calculate new squares');
    }

    const { squares: newSquares } = await response.json();

    // Move existing squares
    const movedSquares = currentSquares
      .filter(i => canMove(i, direction))
      .map(i => moveIndex(i, direction));
    
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