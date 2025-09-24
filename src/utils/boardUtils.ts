import { BOARD_CONFIG } from '../constants/game';
import { createPoint, Point, BasePoint, Direction, BasePoint as BasePointType } from '../types/board';
import type { Accessor, Setter } from 'solid-js';
import { moveSquares } from './directionUtils';
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
    console.log("[Board:handleAddBasePoint] setIsSaving(true)")
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
  const gridSize = BOARD_CONFIG.GRID_SIZE;
  const maxIndex = gridSize * gridSize - 1;
  
  // Convert world coordinates to grid coordinates
  const gridX = x + offsetX;
  const gridY = y + offsetY;
  
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
  isMoving: () => boolean;
  setBasePoints: (value: BasePoint[] | ((prev: BasePoint[]) => BasePoint[])) => void;
  setLastFetchTime: (value: number | ((prev: number) => number)) => void;
  setIsFetching: (value: boolean | ((prev: boolean) => boolean)) => void;
  setRestrictedSquares: (value: number[] | ((prev: number[]) => number[])) => void;
  restrictedSquares: () => number[];
}

export type HandleDirectionOptions = {
  isMoving: Accessor<boolean>;
  currentPosition: Accessor<Point>;
  setCurrentPosition: (value: Point | ((prev: Point) => Point)) => void;
  restrictedSquares: Accessor<number[]>;
  setRestrictedSquares: (value: number[] | ((prev: number[]) => number[])) => void;
  setIsMoving: (value: boolean | ((prev: boolean) => boolean)) => void;
  isBasePoint: (x: number, y: number) => boolean;
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
    isBasePoint
  } = options;

  const now = Date.now();
  
  // Prevent multiple movements at once and enforce cooldown
  if (isMoving() || now - lastMoveTime < MOVE_COOLDOWN_MS) {
    return;
  }
  
  lastMoveTime = now;
  setIsMoving(true);
  
  try {
    const [x, y] = currentPosition();
    const [dx, dy] = getMovementDeltas(dir);
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

    // Calculate the opposite border in the direction of movement
    const borderSquares = [];
    const gridSize = BOARD_CONFIG.GRID_SIZE; // 15x15
    
    // Get the row or column indices for the opposite border
    switch(dir) {
      case 'up':
        // Bottom row (y = gridSize - 1)
        for (let x = 0; x < gridSize; x++) {
          borderSquares.push((gridSize - 1) * gridSize + x);
        }
        break;
      case 'down':
        // Top row (y = 0)
        for (let x = 0; x < gridSize; x++) {
          borderSquares.push(x);
        }
        break;
      case 'left':
        // Right column (x = gridSize - 1)
        for (let y = 0; y < gridSize; y++) {
          borderSquares.push(y * gridSize + (gridSize - 1));
        }
        break;
      case 'right':
        // Left column (x = 0)
        for (let y = 0; y < gridSize; y++) {
          borderSquares.push(y * gridSize);
        }
        break;
    }

    // Update position
    setCurrentPosition(newPosition);
    
    // Get the new indices from the moved squares
    const newIndices = pointsToIndices(newSquares);
    
    try {
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
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.squares && Array.isArray(result.data.squares)) {
          // Check for duplicate indices between newIndices and result.data.squares
          const duplicates = newIndices.filter(index => result.data.squares.includes(index));
          if (duplicates.length > 0) {
            throw new Error(`Duplicate restricted squares found: ${duplicates.join(', ')}`);
          }
          
          // Combine indices (no duplicates expected due to check above)
          const allIndices = [...newIndices, ...result.data.squares];
          const [offsetX, offsetY] = currentPosition();
          
          // Filter out indices that are base points
          const combinedIndices = allIndices.filter(index => {
            const x = index % BOARD_CONFIG.GRID_SIZE;
            const y = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
            const worldX = x - offsetX;
            const worldY = y - offsetY;
            return !isBasePoint(worldX, worldY);
          });
          
          console.log("[Board:handleDirection] Combined indices (base points excluded):", { 
            newIndices, 
            borderSquares: result.data.squares, 
            combinedIndices 
          });
          
          setRestrictedSquares(combinedIndices);
        } else {
          // Fail hard if API response is invalid
          const error = new Error(`Invalid API response format: ${JSON.stringify(result)}`);
          console.error("[Board:handleDirection]", error);
          throw error;
        }
      } else {
        // Fail hard if API call fails
        const error = new Error(`API call failed with status: ${response.status} ${response.statusText}`);
        console.error("[Board:handleDirection]", error);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching border squares:', error);
      // Rethrow the error to be handled by the outer catch block
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to fetch border squares: ${errorMessage}`, { cause: error });
    }
    
  } catch (error) {
    console.error('Movement failed:', error);
    // Re-throw to be handled by the caller if needed
    throw error;
  } finally {
    // Small delay to prevent rapid successive movements
    const remainingCooldown = MOVE_COOLDOWN_MS - (Date.now() - lastMoveTime);
    setTimeout(() => {
      setIsMoving(false);
    }, Math.max(0, remainingCooldown));
  }
};

// Helper functions
const getMovementDeltas = (dir: Direction): [number, number] => {
  switch (dir) {
    case 'up': return [0, -1];
    case 'down': return [0, 1];
    case 'left': return [-1, 0];
    case 'right': return [1, 0];
  }
};

const indicesToPoints = (indices: number[]): Point[] => 
  indices.map(index => createPoint(
    index % BOARD_CONFIG.GRID_SIZE,
    Math.floor(index / BOARD_CONFIG.GRID_SIZE)
  ));

const pointsToIndices = (points: Point[]): number[] => 
  points.map(([x, y]) => y * BOARD_CONFIG.GRID_SIZE + x);

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

  const gridX = index % BOARD_CONFIG.GRID_SIZE;
  const gridY = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
  const [offsetX, offsetY] = currentPosition;
  const worldX = gridX - offsetX;
  const worldY = gridY - offsetY;

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
  isMoving,
  setBasePoints,
  setLastFetchTime,
  setIsFetching,
  setRestrictedSquares,
  restrictedSquares
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
    console.log(`[Board:fetchBasePoints] currentPosition: ${JSON.stringify(currentPosition())}`)
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
      
    /*
    newBasePoints.forEach(pB => {
      const p = {
        x: pB.x + currentPosition()[0], 
        y: pB.y + currentPosition()[1]
      };
      
      if (p.x < BOARD_CONFIG.GRID_SIZE && p.x >= 0 && p.y < BOARD_CONFIG.GRID_SIZE && p.y >= 0) {
        setRestrictedSquares(calculateRestrictedSquares(createPoint(p.x, p.y), restrictedSquares()));
      }
    });
    */
      
    setLastFetchTime(now);
  } catch (error) {
    console.error('Error fetching base points:', error);
  } finally {
    setIsFetching(false);
  }
};
