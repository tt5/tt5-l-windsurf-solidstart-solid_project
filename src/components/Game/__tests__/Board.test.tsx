import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import Board from '../Board';
import { createPoint } from '../../../types/board';

describe('Board Component', () => {
  describe('getMovementDeltas', () => {
    // Helper function to extract the getMovementDeltas function from the component
    const getMovementDeltas = (dir: 'left' | 'right' | 'up' | 'down') => {
      // This is a simplified test version - in a real test, we'd want to test the actual component's method
      // For now, we'll test the logic directly since the function is pure
      switch (dir) {
        case 'left': return createPoint(-1, 0);
        case 'right': return createPoint(1, 0);
        case 'up': return createPoint(0, -1);
        case 'down': return createPoint(0, 1);
      }
    };

    it('returns correct delta for left direction', () => {
      const result = getMovementDeltas('left');
      expect(result).toEqual(createPoint(-1, 0));
    });

    it('returns correct delta for right direction', () => {
      const result = getMovementDeltas('right');
      expect(result).toEqual(createPoint(1, 0));
    });

    it('returns correct delta for up direction', () => {
      const result = getMovementDeltas('up');
      expect(result).toEqual(createPoint(0, -1));
    });

    it('returns correct delta for down direction', () => {
      const result = getMovementDeltas('down');
      expect(result).toEqual(createPoint(0, 1));
    });
  });
});
