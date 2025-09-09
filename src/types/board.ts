// Core types
export type Point = [number, number];
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
