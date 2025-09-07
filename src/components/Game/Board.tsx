import { Component, createEffect, createSignal, onMount, createResource } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
// Local state for selected squares
type SelectedSquares = number[];
import type { 
  Direction, 
  Point, 
  BasePoint, 
  ApiResponse 
} from '../../types/board';
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
  DEFAULT_POSITION: [0, 0],
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
  const navigate = useNavigate();
  const [board, setBoard] = createSignal<BoardConfig>(BOARD_CONFIG);
  
  // Hooks
  const { user, logout } = useAuth();
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>([...BOARD_CONFIG.DEFAULT_POSITION]);
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0);
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  const [isMoving, setIsMoving] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  
  // Initialize loading state on mount
  onMount(() => {
    setIsLoading(true);
    setBasePoints([]);
    
    // Cleanup function
    return () => {
      setIsLoading(false);
    };
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
    if (isFetching() || currentFetch || isMoving() || (timeSinceLastFetch < 30000 && hasData)) {
      return;
    }

    if (!hasData) {
      setIsLoading(true);
    }

    // Create a single fetch promise to prevent duplicates
    currentFetch = (async () => {
      try {
        const response = await fetch('/api/base-points', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        
        const res = await response.json();

        if (Array.isArray(res)) {
          console.log('Setting base points:', res);
          setBasePoints(res);

          // Update selection of squares
          /*
          updateSquares([...new Set(
            [...selectedSquares(),
              ...res.flatMap((p) => [
              ...Array(BOARD_CONFIG.GRID_SIZE-p.x-1).fill(0).map((_, i) => p.x+i+1+p.y*BOARD_CONFIG.GRID_SIZE),
              ...Array(p.x-1).fill(0).map((_, i) => p.x-i-1+res[1]*BOARD_CONFIG.GRID_SIZE),
              ...Array(BOARD_CONFIG.GRID_SIZE-p.y-1).fill(0).map((_, i) => p.x+(p.y+i+1)*BOARD_CONFIG.GRID_SIZE),
              ...Array(p.y-1).fill(0).map((_, i) => res[0]+(p.y-i-1)*BOARD_CONFIG.GRID_SIZE),
              ])
            ])]);
         updateSquares([...new Set([
            ...selectedSquares(),
            ...res.flatMap((p)=>{
              console.log(p, BOARD_CONFIG.GRID_SIZE)
              return [
              ...Array(BOARD_CONFIG.GRID_SIZE-p.x-1).fill(0).map((_, i) => p.x+i+1+p.y*BOARD_CONFIG.GRID_SIZE),
              ...Array(p.x).fill(0).map((_, i) => i+p.y*BOARD_CONFIG.GRID_SIZE),
              ...Array(BOARD_CONFIG.GRID_SIZE-p.y-1).fill(0).map((_, i) => p.x+(p.y+i+1)*BOARD_CONFIG.GRID_SIZE),
              ...Array(p.y).fill(0).map((_, i) => p.x+i*BOARD_CONFIG.GRID_SIZE),
            ]})
         ])])
          */
         updateSquares([...new Set([
          ...selectedSquares(),
          ...res.flatMap((p) => {
            console.log(p, BOARD_CONFIG.GRID_SIZE);
            return [
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
            ];
          })
        ])]);



          setLastFetchTime(now);
          if (res.length > 0) setIsLoading(false);
        } else {
          console.error('Expected array but got:', res);
          setBasePoints([]);
        }

      } catch (error) {
        console.error('Failed to fetch base points:', error);
        if (selectedSquares().length === 0) {
          updateSquares([24]); // Fallback to center square
        }
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        currentFetch = null;
      }
    })();

    await currentFetch;
  };

  // Effect to trigger base points fetch
  createEffect(() => {
    fetchBasePoints().catch(console.error);
  });
  
  // Derived state with explicit return types
  const gridSize = (): number => BOARD_CONFIG.GRID_SIZE;
  const gridIndices = (): number[] => Array.from({ length: gridSize() * gridSize() });
  const username = (): string => currentUser?.username || 'User';
  
  const resetPosition = () => setCurrentPosition([...BOARD_CONFIG.DEFAULT_POSITION]);
  
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

  // Local state for selected squares
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  
  // Reset selected squares when user changes
  createEffect(() => {
    if (currentUser) {
      setSelectedSquares([]);
    }
  });
  
  // Update squares function
  const updateSquares = (squares: SelectedSquares) => {
    setSelectedSquares([...squares]);
  };

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
      console.log('Response data:', responseData);
         updateSquares([...new Set([
          ...selectedSquares(),
          ...[responseData].flatMap((p) => {
            console.log(p, BOARD_CONFIG.GRID_SIZE);
            return [
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
            ];
          })
        ])]);




      
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
    
    // Calculate relative position from player
    const [playerX, playerY] = currentPosition();
    const relativeX = gridX - playerX;
    const relativeY = gridY - playerY;
    
    // Don't proceed if the click is on the player's position
    if (relativeX === 0 && relativeY === 0) return;
    
    try {
      
      const response = await fetch('/api/base-points', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          x: relativeX,
          y: relativeY,
          userId: currentUser.id
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save base point: ${response.status} ${response.statusText}`);
      }
      
      const responseData: AddBasePointResponse = await response.json();
      
      if (responseData.success && responseData.data) {
        setBasePoints(prev => [...prev, responseData.data as BasePoint]);
      } else {
        throw new Error(responseData.error || 'Unknown error saving base point');
      }
      
    } catch (error) {
    }
  };

  // Type for the border calculation response
  interface BorderCalculationResponse {
    squares: number[];
  }

  // Create a resource for the async border calculation with a fallback
  const [borderData] = createResource<BorderCalculationResponse, void>(async () => {
    
    // Fallback squares (center of the board)
    const fallbackSquares = [24]; // Center of 7x7 grid (3,3)
    
    try {
      const requestData = {
        borderIndices: Array(BOARD_CONFIG.GRID_SIZE).fill(0).map((_, i) => i),
        currentPosition: currentPosition(),
        direction: 'right' // Default direction for initial selection
      };
      
      // First try to update with fallback squares
      updateSquares(fallbackSquares);
      
      const response = await fetch('/api/calculate-squares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Board - Error response from border API:', errorText);
        throw new Error(`Failed to calculate border: ${response.status} - ${errorText}`);
      }
      
      const res = await response.json();
      
      // Handle the new response format with success and data wrapper
      if (res?.success && res.data?.squares) {
        return { squares: res.data.squares };
      } else if (res?.squares) {
        // Fallback for old response format
        return { squares: res.squares };
      }
      
      // If response doesn't have squares, use fallback
      return { squares: fallbackSquares };
      
    } catch (error) {
      console.error('Board - Error calculating border:', error);
      console.warn('Board - Using fallback squares due to error');
      return { squares: fallbackSquares };
    }
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
        if (data?.squares) {
          // Only update if we don't have any squares yet
          if (currentSquares.length === 0) {
            updateSquares(data.squares);
          } 
        }
        // Clear loading states
        if (isLoading() || isFetching()) {
          setIsLoading(false);
          setIsFetching(false);
        }
        break;
        
      case 'errored':
        console.warn('Board - Border data error, using fallback');
        // Ensure we have some squares to display
        if (currentSquares.length === 0) {
          updateSquares([24]); // Fallback to center square
        }
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
  const getMovementDeltas = (dir: Direction): [number, number] => {
    switch (dir) {
      case 'left': return [-1, 0];
      case 'right': return [1, 0];
      case 'up': return [0, -1];
      case 'down': return [0, 1];
    }
  };

  // Convert square indices to coordinates
  const indicesToCoords = (indices: number[]) => 
    indices.map(index => [
      index % BOARD_CONFIG.GRID_SIZE,
      Math.floor(index / BOARD_CONFIG.GRID_SIZE)
    ] as [number, number]);

  // Convert coordinates back to indices
  const coordsToIndices = (coords: [number, number][]) => 
    coords.map(([x, y]) => y * BOARD_CONFIG.GRID_SIZE + x);

  const handleDirection = async (dir: Direction) => {
    setIsMoving(true);
    setIsManualUpdate(true);
    
    try {
      const [x, y] = currentPosition();
      const [dx, dy] = getMovementDeltas(dir);
      const newPosition: Point = [x + dx, y + dy];
      
      // Only update player position
      setCurrentPosition(newPosition);
      
      setIsLoading(true);
      
      // Process square movement
      const squaresAsCoords = indicesToCoords([...selectedSquares()]);
      const newSquares = await moveSquares(squaresAsCoords, dir, newPosition);
      
      if (!Array.isArray(newSquares)) {
        throw new Error('Invalid squares array received from moveSquares');
      }
      
      const newIndices = coordsToIndices(newSquares);
      updateSquares(newIndices);
      return newIndices;
      
    } finally {
      setIsLoading(false);
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
        <div style={{ 'display': 'flex', 'gap': '1rem', 'margin-top': '1rem' }}>
          <button 
            onClick={logout} 
            class={styles.button}
            style={{ 'background-color': '#6c757d' }}
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
          
          return (
            <button
              key={index}
              class={`${styles.square} ${isSelected ? styles.selected : ''} ${isBP ? styles.basePoint : ''}`}
              onClick={() => {
                // Don't add a base point if this square is already selected
                if (isSelected) {
                  return;
                }
                handleAddBasePoint(worldX, worldY);
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
