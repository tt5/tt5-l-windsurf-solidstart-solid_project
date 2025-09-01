export type SelectedSquares = number[];

export interface Item {
  id: number;
  data: string;
  created_at: string;
  created_at_ms?: number;  // Millisecond precision timestamp
}

export interface ApiResponse {
  items: Item[];
}

export type SelectedSquares = number[];
