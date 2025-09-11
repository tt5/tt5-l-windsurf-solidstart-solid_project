import { BOARD_CONFIG } from '../components/Game/Board';
import { createPoint, Point, BasePoint } from '../types/board';
import type { Accessor, Setter } from 'solid-js';

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
  setIsLoading,
  setRestrictedSquares,
  restrictedSquares
}: FetchBasePointsOptions): Promise<void> => {
  const currentUser = user();
  if (!currentUser) {
    setBasePoints([]);
    console.log("[Board] setIsLoading(false) (fetchBasePoints)")
    setIsLoading(false);
    return;
  }

  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime();
  
  // Skip if we already have recent data or a request is in progress
  if (isFetching() || isMoving() || (timeSinceLastFetch < 100)) {
    return;
  }

  console.log("[Board] setIsFetching(true) (fetchBasePoints)")
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
      console.log("newBasePoints", JSON.stringify(newBasePoints));
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
