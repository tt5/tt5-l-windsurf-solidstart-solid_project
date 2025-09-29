import { BOARD_CONFIG } from '../constants/game';
import { createPoint, Point, BasePoint, Direction, BasePoint as BasePointType } from '../types/board';
import { createSignal, createEffect, onCleanup, onMount, batch, Accessor } from 'solid-js';
import { moveSquares, DIRECTION_MAP } from './directionUtils';
import type { ApiResponse } from './api';

type AddBasePointOptions = {
  x: number;
  y: number;
  currentUser: { id: string } | null;
  isSaving: () => boolean;
  setIsSaving: (value: boolean | ((prev: boolean) => boolean)) => void;
  setBasePoints: (value: BasePoint[] | ((prev: BasePoint[]) => BasePoint[])) => void;
  isBasePoint: (x: number, y: number, basePoints: BasePoint[]) => boolean;
};

export const handleAddBasePoint = async ({
  x,
  y,
  currentUser,
  isSaving,
  setIsSaving,
  setBasePoints,
  isBasePoint
}: AddBasePointOptions): Promise<ApiResponse<BasePoint>> => {
  if (!currentUser) return { success: false, error: 'User not authenticated', timestamp: Date.now() };
  if (isSaving()) return { success: false, error: 'Operation already in progress', timestamp: Date.now() };

  
  // Validate input coordinates
  if (!isValidCoordinate(x) || !isValidCoordinate(y)) {
    return {
      success: false, 
      error: `Coordinates must be integers between ${BOARD_CONFIG.WORLD_BOUNDS.MIN_X} and ${BOARD_CONFIG.WORLD_BOUNDS.MAX_X} (inclusive)`,
      timestamp: Date.now()
    };
  }
  
  // Get current base points to check for duplicates
  const currentBasePoints = await new Promise<BasePoint[]>((resolve) => {
    setBasePoints(prev => {
      resolve(prev);
      return prev;
    });
  });
  
  // Check for duplicate base point
  if (isBasePoint(x, y, currentBasePoints)) {
    return {
      success: false,
      error: 'Base point already exists at these coordinates',
      timestamp: Date.now()
    };
  }
  
  try {
    setIsSaving(true);
    const response = await fetch('/api/base-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ x, y })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Failed to save base point: ${response.status} ${response.statusText}`,
        timestamp: Date.now()
      };
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
      return {
        success: false,
        error: responseData.error || 'Failed to save base point',
        timestamp: Date.now()
      };
    }
    
    const newBasePoint: BasePoint = {
      x,
      y,
      userId: responseData.data?.userId || currentUser.id,
      createdAtMs: responseData.data?.createdAtMs || Date.now(),
      id: responseData.data?.id || 0
    };
    
    setBasePoints(prev => [...prev, newBasePoint]);
    return {
      success: true,
      data: newBasePoint,
      timestamp: Date.now()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save base point',
      timestamp: Date.now()
    };
  } finally {
    setIsSaving(false);
  }
};


export const calculateRestrictedSquares = (
  p: Point,
  currentRestrictedSquares: number[],
  currentPosition: Point
): number[] => {
  const [x, y] = p; // Base point position in world coordinates
  const [offsetX, offsetY] = currentPosition; // Player's current position
  // opposite direction
  const gridX = x + offsetX;
  const gridY = y + offsetY;

  const gridSize = BOARD_CONFIG.GRID_SIZE;
  const maxIndex = gridSize * gridSize - 1;
  
  
  // Helper function to check if a point is within the grid
  const isValidSquare = (square: number): boolean => {
    return square >= 0 && square <= maxIndex;
  };

  // Calculate squares in a straight line from (gridX,gridY) in a given direction
  const calculateLine = (dx: number, dy: number): number[] => {
    const squares: number[] = [];
    let cx = gridX + dx;
    let cy = gridY + dy;
    
    while (cx >= 0 && cx < gridSize && cy >= 0 && cy < gridSize) {
      const square = cx + cy * gridSize;
      if (isValidSquare(square)) {
        squares.push(square);
      }
      cx += dx;
      cy += dy;
    }
    
    return squares;
  };

  // Calculate all restricted squares
  const newRestrictedSquares = [
    // Horizontal and vertical lines
    ...calculateLine(1, 0),   // Right
    ...calculateLine(-1, 0),  // Left
    ...calculateLine(0, 1),   // Down
    ...calculateLine(0, -1),  // Up
    
    // Diagonal lines (slope 1 and -1)
    ...calculateLine(1, -1),  // Top-right diagonal
    ...calculateLine(-1, -1), // Top-left diagonal
    ...calculateLine(1, 1),   // Bottom-right diagonal
    ...calculateLine(-1, 1),  // Bottom-left diagonal
    
    // Prime-numbered slopes
    ...calculateLine(2, -1),  // Slope 2:1 (up-right)
    ...calculateLine(-2, -1), // Slope 2:1 (up-left)
    ...calculateLine(1, -2),  // Slope 1:2 (up-right)
    ...calculateLine(-1, -2), // Slope 1:2 (up-left)
    ...calculateLine(2, 1),   // Slope 2:1 (down-right)
    ...calculateLine(-2, 1),  // Slope 2:1 (down-left)
    ...calculateLine(1, 2),   // Slope 1:2 (down-right)
    ...calculateLine(-1, 2),  // Slope 1:2 (down-left)
  ].filter(square => square !== x + y * gridSize); // Exclude the current position

  // Combine with existing restricted squares and remove duplicates
  return [
    ...new Set([
      ...currentRestrictedSquares,
      ...newRestrictedSquares.filter(sq => sq >= 0 && sq <= maxIndex)
    ])
  ];
};

type FetchBasePointsOptions = {
  user: () => any;
  currentPosition: () => [number, number];
  lastFetchTime: () => number;
  isFetching: () => boolean;
  setBasePoints: (value: BasePoint[] | ((prev: BasePoint[]) => BasePoint[])) => void;
  setLastFetchTime: (value: number | ((prev: number) => number)) => void;
  setIsFetching: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export type HandleDirectionOptions = {
  isMoving: Accessor<boolean>;
  currentPosition: Accessor<Point>;
  setCurrentPosition: (value: Point) => void;
  restrictedSquares: Accessor<number[]>;
  setRestrictedSquares: ((value: number[]) => void) & ((updater: (prev: number[]) => number[]) => void);
  setIsMoving: (value: boolean | ((prev: boolean) => boolean)) => void;
};

// Track the last movement time to prevent rapid successive movements
let lastMoveTime = 0;
const MOVE_COOLDOWN_MS = 50; // Minimum time between movements in milliseconds

export const handleDirection = async (
  dir: Direction,
  options: HandleDirectionOptions
): Promise<void> => {
  const {
    isMoving,
    currentPosition,
    setCurrentPosition,
    restrictedSquares,
    setRestrictedSquares,
    setIsMoving,
  } = options;

  const now = Date.now();
  
  // Prevent multiple movements at once and enforce cooldown
  const timeSinceLastMove = now - lastMoveTime;
  // Only enforce cooldown if the last move was recent (within 5 seconds)
  const isRecentMove = timeSinceLastMove < 5000; // 5 seconds
  
  if (isMoving() || (isRecentMove && timeSinceLastMove < MOVE_COOLDOWN_MS)) {
    return;
  }
  
  lastMoveTime = now;
  setIsMoving(true);
  
  try {
    const [x, y] = currentPosition();
    const [dx, dy] = DIRECTION_MAP[dir].delta;
    // opposite direction
    const newX = x + dx;
    const newY = y + dy;
    
    // Check world boundaries
    if (newX < BOARD_CONFIG.WORLD_BOUNDS.MIN_X || 
        newX > BOARD_CONFIG.WORLD_BOUNDS.MAX_X ||
        newY < BOARD_CONFIG.WORLD_BOUNDS.MIN_Y || 
        newY > BOARD_CONFIG.WORLD_BOUNDS.MAX_Y) {
      // Don't move beyond world boundaries
      return;
    }
    
    const newPosition = createPoint(newX, newY);
    
    // Process square movement before updating position
    const squaresAsCoords = indicesToPoints([...restrictedSquares()]);
    const newSquares = moveSquares(squaresAsCoords, dir, newPosition);
    const newIndices = pointsToIndices(newSquares);

    // Batch the position and restricted squares updates together
    batch(() => {
      
      // Update position
      setCurrentPosition(newPosition);
      
      // Set temporary restricted squares to prevent flicker
      setRestrictedSquares(prev => [...newIndices]);
    });
    
    // Get the border indices for the opposite direction using directionUtils
    const borderSquares = [...DIRECTION_MAP[dir as keyof typeof DIRECTION_MAP].borderIndices];

    // Fetch new border indices from calculate-squares
    const response = await fetch('/api/calculate-squares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        borderIndices: borderSquares,
        currentPosition: newPosition,
        direction: dir
      })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success || !result.data?.squares || !Array.isArray(result.data.squares)) {
      throw new Error(`Invalid API response format: ${JSON.stringify(result)}`);
    }
    
    // Check for duplicate indices between newIndices and result.data.squares
    const currentIndices = pointsToIndices(newSquares);
    const duplicates = currentIndices.filter(index => result.data.squares.includes(index));
    if (duplicates.length > 0) {
      throw new Error(`Duplicate restricted squares found: ${duplicates.join(', ')}`);
    }
    
    // Combine indices (no duplicates expected due to check above)
    const allIndices = [...currentIndices, ...result.data.squares];
    
    //setRestrictedSquares(combinedIndices);
    setRestrictedSquares(allIndices);
  } catch (error) {
    throw error instanceof Error 
      ? error 
      : new Error('Failed to process movement', { cause: error });
  } finally {
    // Small delay to prevent rapid successive movements
    const remainingCooldown = MOVE_COOLDOWN_MS - (Date.now() - lastMoveTime);
    setTimeout(() => {
      setIsMoving(false);
    }, Math.max(0, remainingCooldown));
  }
};

export const indicesToPoints = (indices: number[]): Point[] => 
  indices.map(index => createPoint(
    index % BOARD_CONFIG.GRID_SIZE,
    Math.floor(index / BOARD_CONFIG.GRID_SIZE)
  ));

export const pointsToIndices = (points: Point[]): number[] => 
  points.map(([x, y]) => y * BOARD_CONFIG.GRID_SIZE + x);

/**
 * Converts grid coordinates to world coordinates using the current position offset
 * @param gridX X coordinate in grid space
 * @param gridY Y coordinate in grid space
 * @param offsetX X offset from current position
 * @param offsetY Y offset from current position
 * @returns [worldX, worldY] in world coordinates
 */
export const gridToWorld = (gridX: number, gridY: number, offsetX: number, offsetY: number): Point => {
  return createPoint(gridX - offsetX, gridY - offsetY);
};

/**
 * Validates if a coordinate is within the world bounds
 * @param value The coordinate value to check
 * @returns boolean indicating if the coordinate is valid
 */
export const isValidCoordinate = (value: number): boolean => {
  return Number.isInteger(value) && 
         value >= BOARD_CONFIG.WORLD_BOUNDS.MIN_X && 
         value <= BOARD_CONFIG.WORLD_BOUNDS.MAX_X;
};

/**
 * Checks if a base point exists at the given coordinates
 */
export const isBasePoint = (x: number, y: number, basePoints: BasePoint[]): boolean => {
  return basePoints.some(point => point.x === x && point.y === y);
};

type ValidationResult = { isValid: boolean; reason?: string };

type ValidateSquarePlacementOptions = {
  index: number;
  currentUser: any;
  currentPosition: Point;
  basePoints: BasePoint[];
  restrictedSquares: number[];
};

/**
 * Validates if a square can have a base point placed on it
 */
export const validateSquarePlacement = ({
  index,
  currentUser,
  currentPosition,
  basePoints,
  restrictedSquares
}: ValidateSquarePlacementOptions): ValidationResult => {
  if (!currentUser) {
    return { isValid: false, reason: 'Not logged in' };
  }

  const [gridX, gridY] = indicesToPoints([index])[0];
  const [offsetX, offsetY] = currentPosition;
  const [worldX, worldY] = gridToWorld(gridX, gridY, offsetX, offsetY);

  // Check if it's the player's position
  if (worldX === 0 && worldY === 0) {
    return { isValid: false, reason: 'Cannot place on player position' };
  }

  // Check if already a base point
  if (isBasePoint(worldX, worldY, basePoints)) {
    return { isValid: false, reason: 'Base point already exists here' };
  }

  // Check if it's a restricted square
  if (restrictedSquares.includes(index)) {
    return { isValid: false, reason: 'Cannot place in restricted area' };
  }

  return { isValid: true };
};

export const fetchBasePoints = async ({
  user,
  currentPosition,
  lastFetchTime,
  isFetching,
  setBasePoints,
  setLastFetchTime,
  setIsFetching,
}: FetchBasePointsOptions): Promise<void> => {
  const currentUser = user();
  if (!currentUser) {
    console.log("[Board:fetchBasePoints] setBasePoints([])")
    setBasePoints([]);
    return;
  }

  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime();
  
  console.log("[Board:fetchBasePoints] setIsFetching(true)")

  // Skip if we already have recent data or a request is in progress
  if (isFetching() || (timeSinceLastFetch < 1000)) {
    return;
  }

  setIsFetching(true);

  try {
    let [x, y] = currentPosition();
    // moves opposite direction
    x = -x;
    y = -y;
    const response = await fetch(`/api/base-points?x=${x}&y=${y}`, {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data } = await response.json();
    
    if (!data || !Array.isArray(data.basePoints)) {
      throw new Error('Invalid response: expected data.basePoints to be an array');
    }
    
    const newBasePoints = data.basePoints;
    setBasePoints(newBasePoints);
      
    setLastFetchTime(now);
  } catch (error) {
    console.error('Error fetching base points:', error);
  } finally {
    setIsFetching(false);
  }
};
