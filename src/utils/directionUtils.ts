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

const movePosition = ([x, y]: [number, number], direction: Direction): [number, number] => {
  switch (direction) {
    case 'up': return [x, y - 1];
    case 'down': return [x, y + 1];
    case 'left': return [x - 1, y];
    case 'right': return [x + 1, y];
  }
};

const isVisible = (index: number, direction: Direction): boolean => {
  // Always allow movement, even if it would take the square off the board
  // The square will be filtered out in the next frame if it's off the board
  return true;
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
  currentSquares: [number, number][],
  direction: Direction,
  currentPosition: [number, number]
): Promise<[number, number][]> => {
  try {
    
    // Move all existing squares
    const movedSquares = currentSquares
      .map(square => {
        const moved = movePosition(square, direction);
        return moved;
      })
      .filter(([x, y]) => {
        const isValid = x >= 0 && x < 7 && y >= 0 && y < 7;
        if (!isValid) {
        }
        return isValid;
      });

    // Get new squares from the server
    const borderIndices = [];
    for (let i = 0; i < 7; i++) {
      borderIndices.push(i, 42 + i);
    }
    for (let i = 1; i < 6; i++) {
      borderIndices.push(i * 7, i * 7 + 6);
    }

    const response = await fetch('/api/calculate-squares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ borderIndices, currentPosition, direction })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to calculate new squares: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    
    const newSquares = responseData.squares || (responseData.data?.squares || []);
    
    if (!Array.isArray(newSquares)) {
      return movedSquares;
    }

    // Convert new square indices to [x, y] coordinates
    const newSquaresAsCoords = newSquares.map((index: number) => {
      const x = index % 7;
      const y = Math.floor(index / 7);
      const coord: [number, number] = [x, y];
      return coord;
    });

    // Only add new squares that don't conflict with existing ones
    const newUniqueSquares = newSquaresAsCoords.filter(
      newSquare => !movedSquares.some(
        existing => existing[0] === newSquare[0] && existing[1] === newSquare[1]
      )
    );
    
    const result = [...movedSquares, ...newUniqueSquares];
    
    return result;
  } catch (error) {
    // Just move the existing squares if there's an error
    const fallback = currentSquares.map(square => movePosition(square, direction));
    return fallback;
  }
};