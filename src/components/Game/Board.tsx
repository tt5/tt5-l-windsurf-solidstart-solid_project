import { 
  Component, 
  createEffect, 
  createSignal, 
  onMount 
} from 'solid-js';
import { moveSquares } from '../../utils/directionUtils';
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
import { calculateRestrictedSquares, fetchBasePoints as fetchBasePointsUtil } from '../../utils/boardUtils';
import styles from './Board.module.css';


// Board configuration
export const BOARD_CONFIG: BoardConfig = {
  GRID_SIZE: 7, // 7x7 grid
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
};

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
      onMount
      setIsLoading setBasePoints([]) fetchBasePoints()
    `)
    setIsLoading(true);
    setBasePoints([]);
    fetchBasePoints();
    
    // Cleanup function
    return () => {
      console.log(`[Board]:onUnmount setIsLoading(false)`)
      setIsLoading(false);
    };
  });
  
  // Refetch base points when position changes
  createEffect(() => {
    // This will run whenever currentPosition changes
    console.log(`[Board]
      currentPosition
      fetchBasePoints
      `)
    currentPosition();
    fetchBasePoints();
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

  // Effect to trigger base points fetch when user changes
  createEffect(() => {
    user();
    fetchBasePoints().catch(console.error);
  });

  // Effect to refetch base points when position changes
  createEffect(() => {
    console.log("[Board] currentPosition (createEffect 2)")
    const [x, y] = currentPosition();
    fetchBasePoints().catch(console.error);
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

  
  // Reset selected squares when user changes
  createEffect(() => {
    if (currentUser) {
      console.log('[Board] User changed, resetting restricted squares');
      setRestrictedSquares([]);
    }
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

  // Initial border squares (center row of the 7x7 grid)
  const INITIAL_SQUARES = [
    0,1,2,3,4,5,6,
    7,8,
    14,16,
    21,24,
    28,32,
    35,40,
    42,48,
  ]


  // Track if we have a manual update in progress
  const [isManualUpdate, setIsManualUpdate] = createSignal(false);
  
  // Initialize squares on mount
  onMount(() => {
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

  // Convert square indices to Point objects
  const indicesToPoints = (indices: number[]) => 
    indices.map(index => createPoint(
      index % BOARD_CONFIG.GRID_SIZE,
      Math.floor(index / BOARD_CONFIG.GRID_SIZE)
    ));

  // Convert Point coordinates back to grid indices
  const pointsToIndices = (coords: Point[]) => 
    coords.map(([x, y]) => y * BOARD_CONFIG.GRID_SIZE + x);

  const handleDirection = async (dir: Direction): Promise<void> => {
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
            
            console.log("Combined indices (base points excluded):", { 
              newIndices, 
              borderSquares: result.data.squares, 
              combinedIndices 
            });
            
            setRestrictedSquares(combinedIndices);
          } else {
            // Fail hard if API response is invalid
            const error = new Error(`Invalid API response format: ${JSON.stringify(result)}`);
            console.error(error);
            throw error;
          }
        } else {
          // Fail hard if API call fails
          const error = new Error(`API call failed with status: ${response.status} ${response.statusText}`);
          console.error(error);
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
