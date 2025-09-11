import { BOARD_CONFIG } from '../components/Game/Board';
import { createPoint, Point, BasePoint, Direction } from '../types/board';
import type { Accessor, Setter } from 'solid-js';
import { moveSquares } from './directionUtils';

export const calculateRestrictedSquares = (
  p: Point,
  currentRestrictedSquares: number[]
): number[] => {
  const [x, y] = p; // Destructure the Point tuple
  return [
    ...new Set([
      ...currentRestrictedSquares,
      // Horizontal and vertical lines
      ...Array(BOARD_CONFIG.GRID_SIZE - x - 1).fill(0).map((_, i) => x + i + 1 + y * BOARD_CONFIG.GRID_SIZE), // Right
      ...Array(x).fill(0).map((_, i) => i + y * BOARD_CONFIG.GRID_SIZE), // Left
      ...Array(BOARD_CONFIG.GRID_SIZE - y - 1).fill(0).map((_, i) => x + (y + i + 1) * BOARD_CONFIG.GRID_SIZE), // Down
      ...Array(y).fill(0).map((_, i) => x + i * BOARD_CONFIG.GRID_SIZE), // Up
      
      // Diagonal lines (slope 1 and -1)
      ...Array(Math.min(BOARD_CONFIG.GRID_SIZE - x - 1, y)).fill(0).map((_, i) => 
        (x + i + 1) + (y - i - 1) * BOARD_CONFIG.GRID_SIZE
      ), // Top-right diagonal
      ...Array(Math.min(x, y)).fill(0).map((_, i) => 
        (x - i - 1) + (y - i - 1) * BOARD_CONFIG.GRID_SIZE
      ), // Top-left diagonal
      ...Array(Math.min(BOARD_CONFIG.GRID_SIZE - x - 1, BOARD_CONFIG.GRID_SIZE - y - 1)).fill(0).map((_, i) => 
        (x + i + 1) + (y + i + 1) * BOARD_CONFIG.GRID_SIZE
      ), // Bottom-right diagonal
      ...Array(Math.min(x, BOARD_CONFIG.GRID_SIZE - y - 1)).fill(0).map((_, i) => 
        (x - i - 1) + (y + i + 1) * BOARD_CONFIG.GRID_SIZE
      ), // Bottom-left diagonal
      
      // Prime-numbered slopes
      // Slope 2:1 (up-right)
      ...Array(Math.ceil(Math.min(
        (BOARD_CONFIG.GRID_SIZE - x - 1) / 2,
        y
      ))).fill(0).map((_, i) => 
        (x + (i + 1) * 2) + (y - i - 1) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 2:1 (up-left)
      ...Array(Math.ceil(Math.min(
        x / 2,
        y
      ))).fill(0).map((_, i) => 
        (x - (i + 1) * 2) + (y - i - 1) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 1:2 (up-right)
      ...Array(Math.ceil(Math.min(
        BOARD_CONFIG.GRID_SIZE - x - 1,
        y / 2
      ))).fill(0).map((_, i) => 
        (x + i + 1) + (y - (i + 1) * 2) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 1:2 (up-left)
      ...Array(Math.ceil(Math.min(
        x,
        y / 2
      ))).fill(0).map((_, i) => 
        (x - i - 1) + (y - (i + 1) * 2) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 2:1 (down-right)
      ...Array(Math.ceil(Math.min(
        (BOARD_CONFIG.GRID_SIZE - x - 1) / 2,
        BOARD_CONFIG.GRID_SIZE - y - 1
      ))).fill(0).map((_, i) => 
        (x + (i + 1) * 2) + (y + i + 1) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 2:1 (down-left)
      ...Array(Math.ceil(Math.min(
        x / 2,
        BOARD_CONFIG.GRID_SIZE - y - 1
      ))).fill(0).map((_, i) => 
        (x - (i + 1) * 2) + (y + i + 1) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 1:2 (down-right)
      ...Array(Math.ceil(Math.min(
        BOARD_CONFIG.GRID_SIZE - x - 1,
        (BOARD_CONFIG.GRID_SIZE - y - 1) / 2
      ))).fill(0).map((_, i) => 
        (x + i + 1) + (y + (i + 1) * 2) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
      
      // Slope 1:2 (down-left)
      ...Array(Math.ceil(Math.min(
        x,
        (BOARD_CONFIG.GRID_SIZE - y - 1) / 2
      ))).fill(0).map((_, i) => 
        (x - i - 1) + (y + (i + 1) * 2) * BOARD_CONFIG.GRID_SIZE
      ).filter(square => square >= 0 && square < BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE),
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
  setIsLoading: (value: boolean | ((prev: boolean) => boolean)) => void;
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
  setIsManualUpdate: (value: boolean | ((prev: boolean) => boolean)) => void;
  setIsLoading: (value: boolean | ((prev: boolean) => boolean)) => void;
  isBasePoint: (x: number, y: number) => boolean;
};

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
    setIsManualUpdate,
    setIsLoading,
    isBasePoint
  } = options;

  if (isMoving()) {
    return; // Prevent multiple movements at once
  }
  
  setIsMoving(true);
  setIsManualUpdate(true);
  setIsLoading(true);
  
  try {
    const [x, y] = currentPosition();
    const [dx, dy] = getMovementDeltas(dir);
    const newPosition = createPoint(x + dx, y + dy);
    
    // Process square movement before updating position
    const squaresAsCoords = indicesToPoints([...restrictedSquares()]);
    const newSquares = moveSquares(squaresAsCoords, dir, newPosition);

    // Calculate the opposite border in the direction of movement
    const borderSquares = [];
    const gridSize = BOARD_CONFIG.GRID_SIZE;
    
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
          // Combine newIndices with the border indices from the API, excluding any base points
          const allIndices = [...new Set([...newIndices, ...result.data.squares])];
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
    setIsLoading(false);
    // Small delay to prevent rapid successive movements
    setTimeout(() => {
      setIsManualUpdate(false);
      setIsMoving(false);
    }, 100);
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
  points.map(([x, y]) => y * BOARD_CONFIG.GRID_SIZE + x);;

export const fetchBasePoints = async ({
  user,
  currentPosition,
  lastFetchTime,
  isFetching,
  isMoving,
  setBasePoints,
  setLastFetchTime,
  setIsFetching,
  setIsLoading,
  setRestrictedSquares,
  restrictedSquares
}: FetchBasePointsOptions): Promise<void> => {
  const currentUser = user();
  if (!currentUser) {
    console.log("[Board:fetchBasePoints] setBasePoints([]) setIsLoading(false)")
    setBasePoints([]);
    setIsLoading(false);
    return;
  }

  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime();
  
  // Skip if we already have recent data or a request is in progress
  if (isFetching() || isMoving() || (timeSinceLastFetch < 100)) {
    return;
  }

  console.log("[Board:fetchBasePoints] setIsFetching(true)")
  setIsFetching(true);

  try {
    const [x, y] = currentPosition();
    const response = await fetch(`/api/base-points?x=${x}&y=${y}`, {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data } = await response.json();
    const newBasePoints = data?.basePoints || [];

    if (Array.isArray(newBasePoints)) {
      console.log("[Board:fetchBasePoints] newBasePoints", JSON.stringify(newBasePoints));
      setBasePoints(newBasePoints);
      
      newBasePoints.forEach(pB => {
        const p = {
          x: pB.x + currentPosition()[0], 
          y: pB.y + currentPosition()[1]
        };
        
        if (p.x < 7 && p.x >= 0 && p.y < 7 && p.y >= 0) {
          setRestrictedSquares(calculateRestrictedSquares(createPoint(p.x, p.y), restrictedSquares()));
        }
      });
      
      setLastFetchTime(now);
    }
  } catch (error) {
    console.error('Error fetching base points:', error);
  } finally {
    setIsFetching(false);
    setIsLoading(false);
  }
};
