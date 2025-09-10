// Core types
declare const brand: unique symbol;
type Brand<T, B> = T & { [brand]: B };

export type Point = Brand<[number, number], 'Point'>;

export function createPoint(x: number, y: number): Point {
  return [x, y] as Point;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface BasePoint {
  id: number;
  x: number;
  y: number;
  userId: string;
  createdAtMs: number;
}

export interface Item {
  id: number;
  data: string;
  created_at: string;
  created_at_ms: number;
  userId: string;
}

// Game state types
export interface GameState {
  position: Point;
  direction: Direction | null;
  selectedSquares: number[];
  basePoints: BasePoint[];
  gridSize: number;
}
