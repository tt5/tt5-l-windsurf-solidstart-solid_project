import { describe, it, expect } from 'vitest';

// A simple utility function for demonstration
function add(a: number, b: number): number {
  return a + b;
}

describe('Example Test Suite', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
