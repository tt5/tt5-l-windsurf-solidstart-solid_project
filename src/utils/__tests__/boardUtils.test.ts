import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPoint } from '../../types/board';
import { BOARD_CONFIG } from '../../constants/game';
import { calculateRestrictedSquares, fetchBasePoints } from '../boardUtils';

const GRID_SIZE = BOARD_CONFIG.GRID_SIZE;

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('calculateRestrictedSquares', () => {
  it('returns calculated restricted squares for position (0,0) when current restricted squares is empty', () => {
    const position = createPoint(0, 0);
    const result = calculateRestrictedSquares(position, []);
    // Should contain at least some expected restricted squares
    expect(result).toContain(1); // Right
    expect(result).toContain(GRID_SIZE); // Down
    expect(result).toContain(GRID_SIZE + 1); // Diagonal down-right
  });

  it('calculates restricted squares in all directions from corner', () => {
    const position = createPoint(0, 0); // Top-left corner
    const result = calculateRestrictedSquares(position, []);
    
    // Should include right, down, and diagonal directions
    expect(result).toContain(1); // Right
    expect(result).toContain(GRID_SIZE); // Down
    expect(result).toContain(GRID_SIZE + 1); // Diagonal down-right
  });

  it('calculates restricted squares in all directions from center', () => {
    const center = Math.floor(GRID_SIZE / 2);
    const position = createPoint(center, center);
    const result = calculateRestrictedSquares(position, []);
    
    // Should include all 8 directions
    expect(result).toContain(center - 1 + center * GRID_SIZE); // Left
    expect(result).toContain(center + 1 + center * GRID_SIZE); // Right
    expect(result).toContain(center + (center - 1) * GRID_SIZE); // Up
    expect(result).toContain(center + (center + 1) * GRID_SIZE); // Down
  });

  it('combines with existing restricted squares', () => {
    const position = createPoint(0, 0);
    const existingSquares = [100, 200];
    const result = calculateRestrictedSquares(position, existingSquares);
    
    // Should include both new restricted squares and existing ones
    expect(result).toContain(1); // New restricted square
    expect(result).toContain(100); // Existing restricted square
    expect(result).toContain(200); // Existing restricted square
  });

  it('excludes current position from restricted squares', () => {
    const x = 3, y = 3;
    const position = createPoint(x, y);
    const result = calculateRestrictedSquares(position, []);
    const currentPositionIndex = x + y * GRID_SIZE;
    
    expect(result).not.toContain(currentPositionIndex);
  });

  it('handles edge of grid correctly', () => {
    const position = createPoint(GRID_SIZE - 1, GRID_SIZE - 1); // Bottom-right corner
    const result = calculateRestrictedSquares(position, []);
    
    // Should only include left, up, and diagonal directions (no right or down)
    expect(result).toContain((GRID_SIZE - 2) + (GRID_SIZE - 1) * GRID_SIZE); // Left
    expect(result).toContain((GRID_SIZE - 1) + (GRID_SIZE - 2) * GRID_SIZE); // Up
    expect(result).toContain((GRID_SIZE - 2) + (GRID_SIZE - 2) * GRID_SIZE); // Diagonal up-left
  });

  it('handles prime-numbered slopes correctly', () => {
    const position = createPoint(5, 5);
    const result = calculateRestrictedSquares(position, []);
    
    // Test some prime-numbered slope squares
    expect(result).toContain(7 + 4 * GRID_SIZE); // dx=2, dy=-1
    expect(result).toContain(3 + 4 * GRID_SIZE); // dx=-2, dy=-1
    expect(result).toContain(6 + 3 * GRID_SIZE); // dx=1, dy=-2
  });
});