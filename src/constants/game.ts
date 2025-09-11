import { createPoint } from '../types/board';

export const BOARD_CONFIG = {
  GRID_SIZE: 15, // 15x15 grid
  DEFAULT_POSITION: createPoint(0, 0),
  DIRECTION_MAP: {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
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
