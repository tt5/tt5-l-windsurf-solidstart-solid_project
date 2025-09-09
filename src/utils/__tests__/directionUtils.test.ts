import { describe, it, expect } from 'vitest';
import * as directionUtils from '../directionUtils';
import type { Point } from '../directionUtils';

describe('moveSquares', () => {
  it('moves a single square to the right', () => {
    const currentSquares: [number, number][] = [[2, 1]]; // x=2, y=1
    const direction = 'right' as const;
    const currentPosition: [number, number] = [0, 0];
    
    const result = directionUtils.moveSquares(currentSquares, direction, currentPosition);
    
    // Should move from [2,1] to [3,1] (x increases by 1 when moving right)
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([3, 1]);
  });

  it('moves a single square to the left', () => {
    const currentSquares: [number, number][] = [[2, 1]];
    const direction = 'left' as const;
    const currentPosition: [number, number] = [0, 0];
    
    const result = directionUtils.moveSquares(currentSquares, direction, currentPosition);
    
    // Should move from [2,1] to [1,1] (x decreases by 1 when moving left)
    expect(result[0]).toEqual([1, 1]);
  });

  it('moves a single square up', () => {
    const currentSquares: [number, number][] = [[2, 2]];
    const direction = 'up' as const;
    const currentPosition: [number, number] = [0, 0];
    
    const result = directionUtils.moveSquares(currentSquares, direction, currentPosition);
    
    // Should move from [2,2] to [2,1] (y decreases by 1 when moving up)
    expect(result[0]).toEqual([2, 1]);
  });

  it('moves a single square down', () => {
    const currentSquares: [number, number][] = [[2, 2]];
    const direction = 'down' as const;
    const currentPosition: [number, number] = [0, 0];
    
    const result = directionUtils.moveSquares(currentSquares, direction, currentPosition);
    
    // Should move from [2,2] to [2,3] (y increases by 1 when moving down)
    expect(result[0]).toEqual([2, 3]);
  });

  it('filters out squares that would move off the grid', () => {
    const testCases = [
      { direction: 'left' as const, position: [0, 3] as Point, expected: [] },
      { direction: 'right' as const, position: [6, 3] as Point, expected: [] },
      { direction: 'up' as const, position: [3, 0] as Point, expected: [] },
      { direction: 'down' as const, position: [3, 6] as Point, expected: [] },
    ];

    testCases.forEach(({ direction, position, expected }) => {
      const result = directionUtils.moveSquares([position], direction, [0, 0]);
      expect(result).toEqual(expected);
    });
  });

  it('handles multiple squares moving in the same direction', () => {
    const squares: Point[] = [
      [1, 1],
      [2, 2],
      [5, 5]
    ];
    
    const result = directionUtils.moveSquares(squares, 'right', [0, 0]);
    expect(result).toHaveLength(3);
    expect(result).toContainEqual([2, 1]);
    expect(result).toContainEqual([3, 2]);
    expect(result).toContainEqual([6, 5]);
  });

  it('filters out squares that move off the grid when moving left', () => {
    const currentSquares: [number, number][] = [[0, 3]]; // At left edge
    const direction = 'left' as const;
    const currentPosition: [number, number] = [0, 0];
    
    const result = directionUtils.moveSquares(currentSquares, direction, currentPosition);
    
    // Should be filtered out as it would move off the grid
    expect(result).toHaveLength(0);
  });
});
