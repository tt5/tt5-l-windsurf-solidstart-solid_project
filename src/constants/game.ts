import { createPoint } from '../types/board';

// World boundaries
const WORLD_RADIUS = 1000;

export const BOARD_CONFIG = {
  GRID_SIZE: 15, // 15x15 grid
  DEFAULT_POSITION: createPoint(0, 0),
  WORLD_BOUNDS: {
    MIN_X: -WORLD_RADIUS,
    MAX_X: WORLD_RADIUS,
    MIN_Y: -WORLD_RADIUS,
    MAX_Y: WORLD_RADIUS,
  } as const,
  DIRECTION_MAP: {
    'ArrowUp': 'down',
    'ArrowDown': 'up',
    'ArrowLeft': 'right',
    'ArrowRight': 'left'
  },
  BUTTONS: [
    { label: 'Random', className: 'randomButton' },
    { label: 'Clear All', className: 'clearButton' }
  ],
  DIRECTIONS: [
    { key: 'up', label: '↑ Up' },
    { key: 'down', label: '↓ Down' },
    { key: 'left', label: '← Left' },
    { key: 'right', label: '→ Right' }
  ]
} as const;

export type BoardConfig = typeof BOARD_CONFIG;
