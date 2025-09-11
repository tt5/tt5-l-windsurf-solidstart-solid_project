import { 
  Component, 
  createEffect, 
  createSignal, 
  onMount,
  on 
} from 'solid-js';
import { useAuth } from '../../contexts/auth';
import { 
  type Direction, 
  type Point, 
  type BasePoint,
  type BoardConfig,
  type RestrictedSquares,
  type AddBasePointResponse,
  createPoint
} from '../../types/board';
import type { ApiResponse } from '../../utils/api';
import { calculateRestrictedSquares, fetchBasePoints as fetchBasePointsUtil, handleDirection as handleDirectionUtil } from '../../utils/boardUtils';
import styles from './Board.module.css';

// Import shared board configuration
import { BOARD_CONFIG } from '~/constants/game';

const Board: Component = () => {
  const [board, setBoard] = createSignal<BoardConfig>(BOARD_CONFIG);
  
  // Hooks
  const { user } = useAuth();
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>(createPoint(BOARD_CONFIG.DEFAULT_POSITION[0], BOARD_CONFIG.DEFAULT_POSITION[1]));
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0);
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  const [isMoving, setIsMoving] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const [restrictedSquares, setRestrictedSquares] = createSignal<RestrictedSquares>([]);
  
  // Check if there's a base point at the given world coordinates
  const isBasePoint = (x: number, y: number): boolean => {
    return basePoints().some(point => point.x === x && point.y === y);
  };
  
  // Initialize loading state on mount
  onMount(() => {
    console.log(`[Board]:
      onMount1
      setIsLoading setBasePoints([]) fetchBasePoints()
    `)
    // Set CSS variable for grid size
    document.documentElement.style.setProperty('--grid-size', BOARD_CONFIG.GRID_SIZE.toString());
    
    setIsLoading(true);
    setBasePoints([]);
    fetchBasePoints();
    
    // Cleanup function
    return () => {
      console.log(`[Board]:onUnmount setIsLoading(false)`)
      setIsLoading(false);
    };
  });
  
  // Track the current fetch promise to prevent duplicate requests
  let currentFetch: Promise<void> | null = null;
  
  // Fetch base points with proper error handling and loading states
  const fetchBasePoints = async () => {
    const promise = fetchBasePointsUtil({
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
    });
    
    if (promise) {
      currentFetch = promise.finally(() => {
        currentFetch = null;
      });
      return currentFetch;
    }
    return Promise.resolve();
  };

  // Effect to handle user changes and fetch base points
  createEffect(on(
    () => user(),
    (currentUserValue) => {
      if (currentUserValue === undefined) return;
      console.log("[Board] Effect: User changed, fetching base points");
      
      // Only reset restricted squares if user logs out
      if (!currentUserValue) {
        setRestrictedSquares([]);
      } else if (restrictedSquares().length === 0) {
        // Initialize with default restricted squares for new user session
        setRestrictedSquares(INITIAL_SQUARES);
      }
      
      // Always fetch base points on user change
      fetchBasePoints().catch(console.error);
    },
    { defer: true }  // Don't run the effect on initial setup
  ));

  // Effect to handle position changes and fetch base points
  createEffect(() => {
    const [x, y] = currentPosition();
    const currentUser = user();
    
    // Skip if we don't have a user or if this is the initial render
    if (!currentUser) return;
    
    console.log(`[Board] Position changed to [${x}, ${y}], fetching base points`);
    
    // Use requestIdleCallback to batch the fetch with the position update
    const id = requestIdleCallback(() => {
      fetchBasePoints().catch(console.error);
    });
    
    return () => cancelIdleCallback(id);
  });
  
  // Derived state with explicit return types
  const gridSize = (): number => BOARD_CONFIG.GRID_SIZE;
  const gridIndices = (): number[] => Array.from({ length: gridSize() * gridSize() });
  const username = (): string => currentUser?.username || 'User';
  
  const resetPosition = () => setCurrentPosition(BOARD_CONFIG.DEFAULT_POSITION);
  
  // Event handler types
  type KeyboardHandler = (e: KeyboardEvent) => void;
  
  // Handle keyboard events with proper type safety
  const handleKeyDown: KeyboardHandler = (e) => {
    
    // Type guard to ensure we only handle arrow keys
    const isArrowKey = (key: string | number): key is keyof typeof BOARD_CONFIG.DIRECTION_MAP => 
      typeof key === 'string' && key in BOARD_CONFIG.DIRECTION_MAP;
    
    if (!isArrowKey(e.key)) {
      return;
    }
    
    e.preventDefault();
    const direction = BOARD_CONFIG.DIRECTION_MAP[e.key];
    handleDirection(direction);
  };
  
  const handleKeyUp: KeyboardHandler = (e) => {
    // Handle key up if needed
  };
  
  // Setup and cleanup event listeners
  onMount(() => {
    console.log("[Board]onMount2")
    const eventListeners: [string, EventListener][] = [
      ['keydown', handleKeyDown as EventListener],
      ['keyup', handleKeyUp as EventListener]
    ];
    
    // Add event listeners
    eventListeners.forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });
    
    // Cleanup function to remove event listeners
    return () => {
      eventListeners.forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  });
  
  // Helper function to create a properly typed API response
  const createResponse = <T,>(success: boolean, data?: T, error?: string): ApiResponse<T> => ({
    success,
    ...(data && { data }),
    ...(error && { error }),
    timestamp: Date.now()
  });

  // Helper function to create a timeout promise
  const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
    const timeout = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(errorMessage));
      }, ms);
    });
    return Promise.race([promise, timeout]);
  };

  // Validate grid coordinates
  const isValidCoordinate = (value: number): boolean => {
    return Number.isInteger(value) && value >= 0 && value < BOARD_CONFIG.GRID_SIZE;
  };

  // Check if a base point already exists at the given coordinates
  const isDuplicateBasePoint = (x: number, y: number): boolean => {
    const points = basePoints();
    return Array.isArray(points) && 
           points.some(point => point.x === x && point.y === y);
  };

  // Handle adding a new base point with proper typing and error handling
  const handleAddBasePoint = async (x: number, y: number): Promise<ApiResponse<BasePoint>> => {
    if (!currentUser) return createResponse<BasePoint>(false, undefined, 'User not authenticated');
    if (isSaving()) return createResponse<BasePoint>(false, undefined, 'Operation already in progress');
    
    // Validate input coordinates
    if (!isValidCoordinate(x) || !isValidCoordinate(y)) {
      return createResponse<BasePoint>(
        false, 
        undefined, 
        `Coordinates must be integers between 0 and ${BOARD_CONFIG.GRID_SIZE - 1} (inclusive)`
      );
    }
    
    // Check for duplicate base point
    if (isDuplicateBasePoint(x, y)) {
      return createResponse<BasePoint>(
        false,
        undefined,
        'Base point already exists at these coordinates'
      );
    }
    
    try {
      setIsSaving(true);
      const response = await withTimeout<AddBasePointResponse>(
        fetch('/api/base-points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ x, y })
        }).then(res => res.json()),
        10000, // 10 second timeout
        'Request timed out'
      );
      
      if (!response.success) {
        return createResponse<BasePoint>(false, undefined, response.error || 'Failed to save base point');
      }
      
      const newBasePoint: BasePoint = {
        x,
        y,
        userId: response.data?.userId || currentUser.id,
        createdAtMs: response.data?.createdAtMs || Date.now(),
        id: 0
      };
      
      setBasePoints(prev => [...prev, newBasePoint]);
      return createResponse<BasePoint>(true, newBasePoint);
      
    } catch (error) {
      return createResponse<BasePoint>(
        false,
        undefined,
        error instanceof Error ? error.message : 'Failed to save base point'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSquareClick = async (index: number) => {
    if (!currentUser) {
      console.warn('No user logged in');
      return;
    }
    
    // Calculate grid position from index
    const gridX = index % BOARD_CONFIG.GRID_SIZE;
    const gridY = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
    
    // Calculate world coordinates (matching the grid rendering logic)
    const [offsetX, offsetY] = currentPosition();
    const worldX = gridX - offsetX;
    const worldY = gridY - offsetY;

    console.log(`--click, ${index}, ${gridX}, ${gridY}, ${worldX}, ${worldY} currentPosition: ${currentPosition()}`)
    
    // Don't proceed if the click is on the player's position or if a base point already exists
    if (worldX === 0 && worldY === 0) return;
    
    // Check if a base point already exists at these coordinates
    const existingPoint = basePoints().find(
      point => point.x === worldX && point.y === worldY
    );
    if (existingPoint) {
      console.log('Base point already exists at these coordinates');
      return;
    }
    
    try {
      console.log('[Board] Sending request to /api/base-points with:', { x: worldX, y: worldY });
      const response = await fetch('/api/base-points', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          x: worldX,
          y: worldY,
          userId: currentUser.id
        })
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to save base point: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();

      
      if (responseData.success && responseData.data?.basePoint) {
        console.log('Successfully added base point:', responseData.data.basePoint);

        const pB: BasePoint = responseData.data.basePoint;
        const p = {x: pB.x + currentPosition()[0], y: pB.y + currentPosition()[1]}
        setRestrictedSquares(calculateRestrictedSquares(createPoint(p.x, p.y), restrictedSquares()));

        setBasePoints(prev => [...prev, responseData.data.basePoint]);
      } else {
        console.error('Unexpected response format:', responseData);
        throw new Error(responseData.error || 'Invalid response format from server');
      }
      
    } catch (error) {
      console.error('Error in handleSquareClick:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
    }
  };

  // Initial squares for a single quadrant with (0,0) at the center
  // Using only positive x and y coordinates (top-right quadrant)
  const localGridSize = 15;
  const centerX = 0;  // Center is at (0,0)
  const centerY = 0;
  
  // Helper function to convert (x,y) to grid index for bottom-right quadrant
  const toIndex = (x: number, y: number): number => {
    // Convert from world coordinates to grid indices
    // For bottom-right quadrant, both x and y increase as we go right and down
    return y * localGridSize + x;
  };
  
  // Calculate all lines in the positive quadrant
  const INITIAL_SQUARES: number[] = [];
  
  // Add axes
  for (let x = 0; x < localGridSize; x++) {
    INITIAL_SQUARES.push(toIndex(x, 0));  // Bottom x-axis
  }
  for (let y = 0; y < localGridSize; y++) {
    INITIAL_SQUARES.push(toIndex(0, y));  // Left y-axis
  }
  
  // Add diagonal (y = x)
  for (let d = 1; d < localGridSize; d++) {
    INITIAL_SQUARES.push(toIndex(d, d));
  }
  
  // Add slope 2:1 (y = 2x)
  for (let x = 1; x < localGridSize / 2; x++) {
    INITIAL_SQUARES.push(toIndex(x, 2 * x));
  }
  
  // Add slope 1:2 (y = x/2)
  for (let x = 2; x < localGridSize; x += 2) {
    INITIAL_SQUARES.push(toIndex(x, x / 2));
  }

  INITIAL_SQUARES.push(toIndex(0, 0));

  // Track if we have a manual update in progress
  const [isManualUpdate, setIsManualUpdate] = createSignal(false);
  
  // Initialize squares on mount
  onMount(() => {
    console.log("[Board] onMount3")
    if (restrictedSquares().length === 0) {
      setRestrictedSquares(INITIAL_SQUARES);
    }
    setIsLoading(false);
  });
  
  // Calculate movement deltas based on direction
  const getMovementDeltas = (dir: Direction): Point => {
    switch (dir) {
      case 'left': return createPoint(-1, 0);
      case 'right': return createPoint(1, 0);
      case 'up': return createPoint(0, -1);
      case 'down': return createPoint(0, 1);
    }
  };

  // Handle direction movement
  const handleDirection = async (dir: Direction): Promise<void> => {
    return handleDirectionUtil(dir, {
      isMoving,
      currentPosition,
      setCurrentPosition,
      restrictedSquares,
      setRestrictedSquares,
      setIsMoving,
      setIsManualUpdate,
      setIsLoading,
      isBasePoint
    });
  };

  return (
    <div class={styles.board}>
      <div class={styles.grid}>
        {Array.from({ length: BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE }).map((_, index) => {
          const x = index % BOARD_CONFIG.GRID_SIZE;
          const y = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
          const [offsetX, offsetY] = currentPosition();
          const worldX = x - offsetX;
          const worldY = y - offsetY;
          const squareIndex = y * BOARD_CONFIG.GRID_SIZE + x;
          const isSelected = restrictedSquares().includes(squareIndex);
          const isBP = isBasePoint(worldX, worldY);
          const isPlayerPosition = worldX === 0 && worldY === 0;

          return (
            <button
              class={`${styles.square} ${isSelected ? styles.selected : ''} ${isBP ? styles.basePoint : ''} ${isPlayerPosition ? styles.playerPosition : ''}`}
              onClick={() => {
                if (isSelected) return;
                handleSquareClick(squareIndex);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                // Right click does nothing now
              }}
              title={isBP ? 'Base Point' : 'Left-click to add base point\nRight-click to select'}
            >
              {isBP && <div class={styles.basePointMarker} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
