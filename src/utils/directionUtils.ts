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
  // Move all existing squares and filter out those that move off-grid
  const movedSquares = currentSquares
    .map(square => movePosition(square, direction))
    .filter(([x, y]) => x >= 0 && x < 7 && y >= 0 && y < 7);

  // Calculate border indices for the incoming edge only
  let borderIndices: number[] = [];
  const gridSize = 7;
  
  switch (direction) {
    case 'up':    // Bottom edge
      borderIndices = Array.from({length: gridSize}, (_, i) => (gridSize - 1) * gridSize + i);
      break;
    case 'down':  // Top edge
      borderIndices = Array.from({length: gridSize}, (_, i) => i);
      break;
    case 'left':  // Right edge
      borderIndices = Array.from({length: gridSize}, (_, i) => (i * gridSize) + (gridSize - 1));
      break;
    case 'right': // Left edge
      borderIndices = Array.from({length: gridSize}, (_, i) => i * gridSize);
      break;
  }

  // Get new squares from the server
  const response = await fetch('/api/calculate-squares', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ borderIndices, currentPosition, direction })
  });

  const responseData = await response.json();
  
  if (!response.ok || !responseData.success) {
    throw new Error(
      `Failed to calculate new squares: ${response.status} ${response.statusText}\n` +
      (responseData.error ? `Error: ${responseData.error}` : 'Unknown error')
    );
  }

  const newSquares = responseData.data?.squares;
  
  if (!Array.isArray(newSquares)) {
    throw new Error('Invalid response format: expected array of squares');
  }

  // Convert indices to coordinates and filter out existing squares
  const newSquaresSet = new Set(movedSquares.map(([x, y]) => `${x},${y}`));
  const newUniqueSquares = newSquares
    .map(index => {
      if (typeof index !== 'number' || index < 0 || index >= gridSize * gridSize) {
        throw new Error(`Invalid square index: ${index}`);
      }
      return [index % 7, Math.floor(index / 7)] as [number, number];
    })
    .filter(([x, y]) => !newSquaresSet.has(`${x},${y}`));
  
  return [...movedSquares, ...newUniqueSquares];
};