import { createPoint, type Direction, type Point } from '../types/board';
import { BOARD_CONFIG } from '../constants/game';

const GRID_SIZE = BOARD_CONFIG.GRID_SIZE;

/**
 * Generates border indices for a specific edge of the grid
 * @param edge Which edge to generate indices for
 * @returns Array of indices for the specified edge
 */
export const getBorderIndices = (edge: 'top' | 'bottom' | 'left' | 'right'): readonly number[] => {
  const last = GRID_SIZE - 1;
  
  switch (edge) {
    case 'top':    return Array.from({ length: GRID_SIZE }, (_, i) => i);
    case 'bottom': return Array.from({ length: GRID_SIZE }, (_, i) => last * GRID_SIZE + i);
    case 'left':   return Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE);
    case 'right':  return Array.from({ length: GRID_SIZE }, (_, i) => i * GRID_SIZE + last);
    default: 
      const _exhaustiveCheck: never = edge;
      return _exhaustiveCheck;
  }
};

/**
 * Contains movement and border information for a direction
 */
interface DirectionVectors {
  /**
   * The delta [dx, dy] to move in this direction
   */
  delta: Point;
  
  /**
   * Indices of the border squares for this direction
   */
  borderIndices: readonly number[];
}

/**
 * Maps each direction to its movement and border information
 */
export const DIRECTION_MAP: Record<Direction, DirectionVectors> = {
  up: {
    delta: createPoint(0, -1),
    borderIndices: getBorderIndices('bottom')
  },
  down: {
    delta: createPoint(0, 1),
    borderIndices: getBorderIndices('top')
  },
  left: {
    delta: createPoint(-1, 0),
    borderIndices: getBorderIndices('right')
  },
  right: {
    delta: createPoint(1, 0),
    borderIndices: getBorderIndices('left')
  }
};

/**
 * Moves a point in the specified direction
 */
/**
 * Calculates the new position after moving in the specified direction
 * @param position Current position [x, y]
 * @param direction Direction to move
 * @returns New position after movement
 */
const movePosition = ([x, y]: Point, direction: Direction): Point => {
  const { delta: [dx, dy] } = DIRECTION_MAP[direction];
  return createPoint(x + dx, y + dy);
};

/**
 * Moves all squares in the specified direction and returns their new positions
 * @param currentSquares Array of current square positions
 * @param direction Direction to move the squares
 * @param currentPosition Current position (unused in this simplified version)
 * @returns Array of new square positions after movement
 */
export const moveSquares = (
  currentSquares: readonly Point[],
  direction: Direction,
  currentPosition: Point
): Point[] => {
  // Move all existing squares and filter out those that move off-grid
  return currentSquares
    .map(square => movePosition(square, direction))
    .filter(([x, y]) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE);
};