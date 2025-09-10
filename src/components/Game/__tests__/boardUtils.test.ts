import { describe, it, expect } from 'vitest';
import { createPoint } from '../../../types/board';

// Mock the BOARD_CONFIG since it's used in the functions
const GRID_SIZE = 7;
const mockBoardConfig = {
  GRID_SIZE,
  // Add other required properties if needed
};

// We'll test these functions directly
const indicesToPoints = (indices: number[], gridSize: number = GRID_SIZE) => 
  indices.map(index => createPoint(
    index % gridSize,
    Math.floor(index / gridSize)
  ));

const pointsToIndices = (coords: Point[], gridSize: number = GRID_SIZE) => 
  coords.map(([x, y]) => y * gridSize + x);

describe('Board Utilities', () => {
  describe('indicesToPoints', () => {
    it('converts indices to Point objects correctly', () => {
      // Test with a 7x7 grid (GRID_SIZE = 7)
      const indices = [0, 8, 15, 48];
      const expected = [
        createPoint(0, 0),  // index 0 -> (0, 0)
        createPoint(1, 1),  // index 8 -> (1, 1)  (7*1 + 1 = 8)
        createPoint(1, 2),  // index 15 -> (1, 2) (7*2 + 1 = 15)
        createPoint(6, 6),  // index 48 -> (6, 6) (7*6 + 6 = 48)
      ];

      const result = indicesToPoints(indices);
      expect(result).toEqual(expected);
    });

    it('handles empty array', () => {
      expect(indicesToPoints([])).toEqual([]);
    });

    it('works with custom grid size', () => {
      const indices = [0, 5, 10, 24];
      const customGridSize = 5;
      const expected = [
        createPoint(0, 0),  // 0 -> (0, 0)
        createPoint(0, 1),  // 5 -> (0, 1)  (5*1 + 0 = 5)
        createPoint(0, 2),  // 10 -> (0, 2) (5*2 + 0 = 10)
        createPoint(4, 4),  // 24 -> (4, 4) (5*4 + 4 = 24)
      ];

      const result = indicesToPoints(indices, customGridSize);
      expect(result).toEqual(expected);
    });
  });

  describe('pointsToIndices', () => {
    it('converts points to indices correctly', () => {
      const coords = [
        createPoint(0, 0),  // (0, 0) -> 0
        createPoint(1, 1),  // (1, 1) -> 8  (7*1 + 1 = 8)
        createPoint(6, 6),  // (6, 6) -> 48 (7*6 + 6 = 48)
      ];
      const expected = [0, 8, 48];

      const result = pointsToIndices(coords);
      expect(result).toEqual(expected);
    });

    it('handles empty array', () => {
      expect(pointsToIndices([])).toEqual([]);
    });

    it('works with custom grid size', () => {
      const coords = [
        createPoint(0, 0),  // (0, 0) -> 0
        createPoint(4, 4),  // (4, 4) -> 24 (5*4 + 4 = 24)
      ];
      const customGridSize = 5;
      const expected = [0, 24];

      const result = pointsToIndices(coords, customGridSize);
      expect(result).toEqual(expected);
    });
  });

  describe('round-trip conversion', () => {
    it('converts back and forth between indices and coordinates', () => {
      const originalIndices = [0, 1, 7, 8, 48];
      
      // Convert to coordinates and back
      const coords = indicesToPoints(originalIndices);
      const roundTrippedIndices = pointsToIndices(coords);
      
      expect(roundTrippedIndices).toEqual(originalIndices);
    });
  });
});
