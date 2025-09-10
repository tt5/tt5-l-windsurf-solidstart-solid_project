import { 
  Component, 
  createEffect, 
  createSignal, 
  createResource, 
  onMount 
} from 'solid-js';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import { 
  type Direction, 
  type Point, 
  type BasePoint,
  createPoint
} from '../../types/board';
import type { ApiResponse } from '../../utils/api';

// Local state for selected squares
type SelectedSquares = number[];
import styles from './Board.module.css';

// Types for board configuration
type BoardConfig = {
  readonly GRID_SIZE: number;
  readonly DEFAULT_POSITION: Point;
  readonly DIRECTION_MAP: {
    readonly [key: string]: Direction;
    readonly ArrowUp: Direction;
    readonly ArrowDown: Direction;
    readonly ArrowLeft: Direction;
    readonly ArrowRight: Direction;
  };
  readonly BUTTONS: readonly {
    readonly label: string;
    readonly className: string;
  }[];
  readonly DIRECTIONS: readonly {
    readonly key: Direction;
    readonly label: string;
  }[];
};

// Board configuration
const BOARD_CONFIG: BoardConfig = {
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
    { key: 'left', label: '← Left' },
    { key: 'right', label: 'Right →' },
    { key: 'down', label: '↓ Down' }
  ]
} as const;

// Type for the response when adding a base point
interface AddBasePointResponse extends ApiResponse<BasePoint> {}

const Board: Component = () => {
  const [board, setBoard] = createSignal<BoardConfig>(BOARD_CONFIG);
  
  // Hooks
  const { user, logout } = useAuth();
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>(createPoint(BOARD_CONFIG.DEFAULT_POSITION[0], BOARD_CONFIG.DEFAULT_POSITION[1]));
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0);
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  const [isMoving, setIsMoving] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  
  // Initialize loading state on mount
  onMount(() => {
    setIsLoading(true);
    setBasePoints([]);
    fetchBasePoints();
    
    // Cleanup function
    return () => {
      setIsLoading(false);
    };
  });
  
  // Refetch base points when position changes
  createEffect(() => {
    // This will run whenever currentPosition changes
    currentPosition();
    fetchBasePoints();
  });
  
  // Track the current fetch promise to prevent duplicate requests
  let currentFetch: Promise<void> | null = null;
  
  // Fetch base points with proper error handling and loading states
  const fetchBasePoints = async () => {
    const currentUser = user();
    if (!currentUser) {
      setBasePoints([]);
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime();
    const hasData = basePoints().length > 0;
    
    // Skip if we already have recent data or a request is in progress
    if (isFetching() || currentFetch || isMoving() || (timeSinceLastFetch < 100 && hasData)) {
      return;
    }

    setIsFetching(true);
    if (!hasData) {
      setIsLoading(true);
    }

    // Create a single fetch promise to prevent duplicates
    currentFetch = (async () => {
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
          console.log("newBasePoints", JSON.stringify(newBasePoints))
          setBasePoints(newBasePoints);
          basePoints().forEach(pB => {
            const p = {x: pB.x + currentPosition()[0], y: pB.y + currentPosition()[1]}
              console.log(`before p: ${p.x}, ${p.y}`)
            if (p.x < 7 &&  p.x >= 0 && p.y < 7 && p.y >= 0) {
              console.log(`p: ${p.x}, ${p.y}`)
              
            // TODO: res.flatMap(e => [p.x, p.y])
            //  only coordinates that fall into the initial grid
            // [0,0] x [6,6]
              setSelectedSquares([...new Set([
              ...selectedSquares(),
                  // Existing horizontal and vertical lines
                  ...Array(BOARD_CONFIG.GRID_SIZE - p.x - 1).fill(0).map((_, i) => p.x + i + 1 + p.y * BOARD_CONFIG.GRID_SIZE), // Right
                  ...Array(p.x).fill(0).map((_, i) => i + p.y * BOARD_CONFIG.GRID_SIZE), // Left
                  ...Array(BOARD_CONFIG.GRID_SIZE - p.y - 1).fill(0).map((_, i) => p.x + (p.y + i + 1) * BOARD_CONFIG.GRID_SIZE), // Down
                  ...Array(p.y).fill(0).map((_, i) => p.x + i * BOARD_CONFIG.GRID_SIZE), // Up
                  
                  // New diagonal lines
                  // Top-right diagonal
                  ...Array(Math.min(BOARD_CONFIG.GRID_SIZE - p.x - 1, p.y)).fill(0).map((_, i) => 
                    (p.x + i + 1) + (p.y - i - 1) * BOARD_CONFIG.GRID_SIZE
                  ),
                  // Top-left diagonal
                  ...Array(Math.min(p.x, p.y)).fill(0).map((_, i) => 
                    (p.x - i - 1) + (p.y - i - 1) * BOARD_CONFIG.GRID_SIZE
                  ),
                  // Bottom-right diagonal
                  ...Array(Math.min(BOARD_CONFIG.GRID_SIZE - p.x - 1, BOARD_CONFIG.GRID_SIZE - p.y - 1)).fill(0).map((_, i) => 
                    (p.x + i + 1) + (p.y + i + 1) * BOARD_CONFIG.GRID_SIZE
                  ),
                  // Bottom-left diagonal
                  ...Array(Math.min(p.x, BOARD_CONFIG.GRID_SIZE - p.y - 1)).fill(0).map((_, i) => 
                    (p.x - i - 1) + (p.y + i + 1) * BOARD_CONFIG.GRID_SIZE
                  )
            ])]);
          }
            })
          setLastFetchTime(now);
        }
      } catch (error) {
        console.error('Error fetching base points:', error);
      } finally {
        setIsFetching(false);
        setIsLoading(false);
        currentFetch = null;
      }
    })();

    return currentFetch;
  };

  // Effect to trigger base points fetch when user changes
  createEffect(() => {
    user();
    fetchBasePoints().catch(console.error);
  });

  // Effect to refetch base points when position changes
  createEffect(() => {
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
      setSelectedSquares([]);
    }
  });
  
  // Enhanced return type for better error handling
  type SaveResult = {
    success: boolean;
    error?: string;
    data?: BasePoint;
  };

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
  const handleAddBasePoint = async (x: number, y: number): Promise<SaveResult> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    if (isSaving()) return { success: false, error: 'Operation already in progress' };
    
    // Validate input coordinates
    if (!isValidCoordinate(x) || !isValidCoordinate(y)) {
      return { 
        success: false, 
        error: `Coordinates must be integers between 0 and ${BOARD_CONFIG.GRID_SIZE - 1} (inclusive)` 
      };
    }
    
    // Check for duplicate base point
    if (isDuplicateBasePoint(x, y)) {
      return {
        success: false,
        error: `A base point already exists at position (${x}, ${y})`
      };
    }
    
    setIsSaving(true);
    let controller: AbortController | null = new AbortController();
    
    try {
      const fetchPromise = fetch('/api/base-points', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ x, y }),
        signal: controller?.signal
      });
      
      // Set a 10 second timeout for the request
      const response = await withTimeout(
        fetchPromise,
        10000, // 10 seconds
        'Request timed out. Please try again.'
      );
      
      // Clear the controller reference since we don't need it anymore
      controller = null;
      
      const responseData = await response.json();

      
      if (!response.ok) {
        const errorMessage = responseData?.error || 'Failed to save base point';
        console.error('Error saving base point:', errorMessage);
        return { success: false, error: errorMessage };
      }
      
      // Success case - update the base points
      if (!responseData) {
        console.error('No data in successful response');
        return { success: false, error: 'No data in response' };
      }
      
      const newBasePoint: BasePoint = {
        id: responseData.id,
        x: responseData.x,
        y: responseData.y,
        userId: responseData.userId,
        createdAtMs: responseData.createdAtMs
      };
      setBasePoints(prev => [...prev, newBasePoint]);
      return { success: true, data: newBasePoint };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Unexpected error in handleAddBasePoint:', error);
      return { success: false, error: errorMessage };
    } finally {
      // Abort the request if it's still pending
      if (controller) {
        controller.abort();
      }
      setIsSaving(false);
    }
  };

  // Check if a grid cell is a base point
  const isBasePoint = (worldX: number, worldY: number) => {
    try {
      const points = basePoints();
      if (!Array.isArray(points)) {
        return false;
      }
      
      // Check if there's a base point at these world coordinates
      return points.some(bp => {
        if (!bp || typeof bp.x !== 'number' || typeof bp.y !== 'number') {
          return false;
        }
        // Check if this base point matches the world coordinates
        return bp.x === worldX && bp.y === worldY;
      });
    } catch (error) {
      console.error('Error in isBasePoint:', error);
      return false;
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
      console.log('Sending request to /api/base-points with:', { x: worldX, y: worldY });
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
        setSelectedSquares([...new Set([
          ...selectedSquares(),
              // Existing horizontal and vertical lines
              ...Array(BOARD_CONFIG.GRID_SIZE - p.x - 1).fill(0).map((_, i) => p.x + i + 1 + p.y * BOARD_CONFIG.GRID_SIZE), // Right
              ...Array(p.x).fill(0).map((_, i) => i + p.y * BOARD_CONFIG.GRID_SIZE), // Left
              ...Array(BOARD_CONFIG.GRID_SIZE - p.y - 1).fill(0).map((_, i) => p.x + (p.y + i + 1) * BOARD_CONFIG.GRID_SIZE), // Down
              ...Array(p.y).fill(0).map((_, i) => p.x + i * BOARD_CONFIG.GRID_SIZE), // Up
              
              // New diagonal lines
              // Top-right diagonal
              ...Array(Math.min(BOARD_CONFIG.GRID_SIZE - p.x - 1, p.y)).fill(0).map((_, i) => 
                (p.x + i + 1) + (p.y - i - 1) * BOARD_CONFIG.GRID_SIZE
              ),
              // Top-left diagonal
              ...Array(Math.min(p.x, p.y)).fill(0).map((_, i) => 
                (p.x - i - 1) + (p.y - i - 1) * BOARD_CONFIG.GRID_SIZE
              ),
              // Bottom-right diagonal
              ...Array(Math.min(BOARD_CONFIG.GRID_SIZE - p.x - 1, BOARD_CONFIG.GRID_SIZE - p.y - 1)).fill(0).map((_, i) => 
                (p.x + i + 1) + (p.y + i + 1) * BOARD_CONFIG.GRID_SIZE
              ),
              // Bottom-left diagonal
              ...Array(Math.min(p.x, BOARD_CONFIG.GRID_SIZE - p.y - 1)).fill(0).map((_, i) => 
                (p.x - i - 1) + (p.y + i + 1) * BOARD_CONFIG.GRID_SIZE
              )
        ])]);

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

  // Type for the border calculation response
  interface BorderCalculationResponse {
    squares: number[];
  }

  // Hardcoded initial border calculation
  const [borderData] = createResource<BorderCalculationResponse, void>(async () => {
    // Center row of the 7x7 grid (indices 21-27)
    const initialSquares = [21, 22, 23, 24, 25, 26, 27];
    
    // Set the initial selected squares
    setSelectedSquares(initialSquares);
    
    // Return the squares in the expected format
    return { squares: initialSquares };
  });

  // Track if we have a manual update in progress
  const [isManualUpdate, setIsManualUpdate] = createSignal(false);
  
  // Single effect to handle border data and loading states
  createEffect(() => {
    // Skip updates during manual operations
    if (isManualUpdate()) {
      return;
    }
    
    const data = borderData();
    const currentState = borderData.state;
    const currentSquares = selectedSquares();
    
    switch (currentState) {
      case 'ready':
        // Only update if this is the initial load and we don't have any squares
        if (data?.squares && currentSquares.length === 0 && borderData.loading) {
          setSelectedSquares(data.squares);
        }
        // Clear loading states
        if (isLoading() || isFetching()) {
          setIsLoading(false);
          setIsFetching(false);
        }
        break;
        
      case 'errored':
        console.warn('Board - Border data error');
        // Allow empty selection state
        // Clear loading states
        setIsLoading(false);
        setIsFetching(false);
        break;
        
      case 'pending':
        // Only set loading if we don't have any squares yet
        if (currentSquares.length === 0) {
          setIsLoading(true);
        }
        break;
    }
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
      const squaresAsCoords = indicesToPoints([...selectedSquares()]);
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
          if (result.success && Array.isArray(result.data)) {
            // Combine newIndices with the border indices from the API
            const combinedIndices = [...new Set([...newIndices, ...result.data])];
            setSelectedSquares(combinedIndices);
          } else {
            // Fallback to just newIndices if API response is invalid
            setSelectedSquares(newIndices);
          }
        } else {
          // Fallback to just newIndices if API call fails
          setSelectedSquares(newIndices);
        }
      } catch (error) {
        console.error('Error fetching border squares:', error);
        // Fallback to just newIndices if there's an error
        setSelectedSquares(newIndices);
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


  // Determine if we should show loading state
  const showLoading = () => {
    // If we're in a loading or fetching state and don't have any squares yet
    if ((isLoading() || isFetching()) && selectedSquares().length === 0) {
      return true;
    }
    
    // If border data is still pending and we don't have any squares
    if (borderData.state === 'pending' && selectedSquares().length === 0) {
      return true;
    }
    
    return false;
  };
  
  // Show loading state if needed
  if (showLoading()) {
    return (
      <div class={styles.loadingContainer}>
        <div class={styles.loadingSpinner}></div>
        <p>Loading game data...</p>
        <div class={styles.loadingMessage}>
          {!user() ? 'Waiting for user authentication...' : 'Fetching game data...'}
        </div>
      </div>
    );
  }
  
  console.log('Rendering base points:', basePoints());

  return (
    <div class={styles.board}>
      <div class={styles.userBar}>
        <span>Welcome, {user()?.username || 'User'}!</span>
        <div class={styles.userBarActions}>
          <button 
            onClick={logout} 
            class={`${styles.button} ${styles.logoutButton}`}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div class={styles.grid}>
        {Array.from({ length: BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE }).map((_, index) => {
          const x = index % BOARD_CONFIG.GRID_SIZE;
          const y = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
          const [offsetX, offsetY] = currentPosition();
          const worldX = x - offsetX;
          const worldY = y - offsetY;
          const squareIndex = y * BOARD_CONFIG.GRID_SIZE + x;
          const isSelected = selectedSquares().includes(squareIndex);
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
