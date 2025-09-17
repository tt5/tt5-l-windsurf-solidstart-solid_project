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
  type RestrictedSquares,
  type AddBasePointResponse,
  createPoint
} from '../../types/board';
import type { ApiResponse } from '../../utils/api';
import { 
  calculateRestrictedSquares, 
  fetchBasePoints as fetchBasePointsUtil, 
  handleDirection as handleDirectionUtil,
  handleAddBasePoint 
} from '../../utils/boardUtils';
import styles from './Board.module.css';

// Import shared board configuration
import { BOARD_CONFIG } from '~/constants/game';

const Board: Component = () => {
  
  // Hooks
  const { user } = useAuth();
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>(createPoint(BOARD_CONFIG.DEFAULT_POSITION[0], BOARD_CONFIG.DEFAULT_POSITION[1]));
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0); // base points, rate limiting
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  const [isMoving, setIsMoving] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const [restrictedSquares, setRestrictedSquares] = createSignal<RestrictedSquares>([]);
  const [hoveredSquare, setHoveredSquare] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [reachedBoundary, setReachedBoundary] = createSignal<boolean>(false);
  
  // Check if there's a base point at the given world coordinates
  const isBasePoint = (x: number, y: number): boolean => {
    return basePoints().some(point => point.x === x && point.y === y);
  };

  // Validate if a square can have a base point
  const validateSquarePlacement = (index: number): { isValid: boolean; reason?: string } => {
    if (!currentUser) {
      return { isValid: false, reason: 'Not logged in' };
    }

    const gridX = index % BOARD_CONFIG.GRID_SIZE;
    const gridY = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
    const [offsetX, offsetY] = currentPosition();
    const worldX = gridX - offsetX;
    const worldY = gridY - offsetY;

    // Check if it's the player's position
    if (worldX === 0 && worldY === 0) {
      return { isValid: false, reason: 'Cannot place on player position' };
    }

    // Check if already a base point
    if (isBasePoint(worldX, worldY)) {
      return { isValid: false, reason: 'Base point already exists here' };
    }

    // Check if it's a restricted square
    if (restrictedSquares().includes(index)) {
      return { isValid: false, reason: 'Cannot place in restricted area' };
    }

    return { isValid: true };
  };

  // Handle square hover
  const handleSquareHover = (index: number | null) => {
    setHoveredSquare(index);
    if (index === null) {
      setError(null);
    } else {
      const validation = validateSquarePlacement(index);
      if (!validation.isValid) {
        setError(validation.reason || 'Invalid placement');
      } else {
        setError(null);
      }
    }
  };
  
  // Initialize on mount
  onMount(() => {
    console.log(`[Board]: onMount1 - setBasePoints([]), fetchBasePoints()`);
    // Set CSS variable for grid size
    document.documentElement.style.setProperty('--grid-size', BOARD_CONFIG.GRID_SIZE.toString());
    
    setBasePoints([]);
    fetchBasePoints();
    
    // Cleanup function
    return () => {
      console.log(`[Board]: onUnmount1`);
    };
  });
  
  // Track the current fetch promise to prevent duplicate requests
  let currentFetch: Promise<void> | null = null;
  
  // Fetch base points with proper error handling and loading states
  const fetchBasePoints = async () => {
    const promise = fetchBasePointsUtil({
      user: () => currentUser,
      currentPosition,
      lastFetchTime,
      isFetching,
      isMoving,
      setBasePoints,
      setLastFetchTime,
      setIsFetching,
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
    
    console.log(`[Board] Effect1 - Position changed to [${x}, ${y}], fetching base points`);
    
    // Use requestIdleCallback to batch the fetch with the position update
    const id = requestIdleCallback(() => {
      fetchBasePoints().catch(console.error);
    });
    
    return () => cancelIdleCallback(id);
  });
  
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
    console.log("[Board] onMount2 - event listeners")
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
  // handleAddBasePoint has been moved to boardUtils.ts

  const handleSquareClick = async (index: number) => {
    // Calculate grid position from index
    const gridX = index % BOARD_CONFIG.GRID_SIZE;
    const gridY = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
    const [offsetX, offsetY] = currentPosition();
    const worldX = gridX - offsetX;
    const worldY = gridY - offsetY;

    console.log(`[Board] handleSquareClick - Attempting to add base point at:`, { x: worldX, y: worldY });
    
    try {
      const response = await handleAddBasePoint({
        x: worldX,
        y: worldY,
        currentUser,
        isSaving,
        setIsSaving,
        setBasePoints,
        isDuplicateBasePoint,
        isValidCoordinate
      });
      
      if (response.success && response.data) {
        console.log('Successfully added base point:', response.data);
        
        // Recalculate restricted squares with the new base point
        const newRestrictedSquares = calculateRestrictedSquares(
          createPoint(worldX, worldY),
          restrictedSquares()
        );
        setRestrictedSquares(newRestrictedSquares);
      } else if (response.error) {
        console.error('Error adding base point:', response.error);
        setError(response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in handleSquareClick:', errorMessage);
      setError(errorMessage);
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
  createEffect(() => {
    // Initialize restricted squares if empty
    if (restrictedSquares().length === 0) {
      setRestrictedSquares(INITIAL_SQUARES);
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

  // Handle direction movement
  const handleDirection = async (dir: Direction): Promise<void> => {
    setReachedBoundary(false); // Reset boundary flag on new movement
    
    const [x, y] = currentPosition();
    const [dx, dy] = getMovementDeltas(dir);
    const newX = x + dx;
    const newY = y + dy;
    
    // Check world boundaries
    if (newX < BOARD_CONFIG.WORLD_BOUNDS.MIN_X || 
        newX > BOARD_CONFIG.WORLD_BOUNDS.MAX_X ||
        newY < BOARD_CONFIG.WORLD_BOUNDS.MIN_Y || 
        newY > BOARD_CONFIG.WORLD_BOUNDS.MAX_Y) {
      setReachedBoundary(true);
      return;
    }
    
    return handleDirectionUtil(dir, {
      isMoving,
      currentPosition,
      setCurrentPosition,
      restrictedSquares,
      setRestrictedSquares,
      setIsMoving,
      setIsManualUpdate,
      isBasePoint
    });
  };

  return (
    <div class={styles.board}>
      {reachedBoundary() && (
        <div class={styles.boundaryMessage}>
          You've reached the edge of the world!
        </div>
      )}
      <div class={styles.positionIndicator}>
        Position: ({currentPosition()[0]}, {currentPosition()[1]})
      </div>
      <div class={styles.grid}>
        {Array.from({ length: BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE }).map((_, index) => {
          const x = index % BOARD_CONFIG.GRID_SIZE;
          const y = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
          const [offsetX, offsetY] = currentPosition();
          const worldX = x - offsetX;
          const worldY = y - offsetY;
          const squareIndex = y * BOARD_CONFIG.GRID_SIZE + x;
          const isBP = isBasePoint(worldX, worldY);
          const isSelected = restrictedSquares().includes(squareIndex);
          const isPlayerPosition = worldX === 0 && worldY === 0;
          const isHovered = hoveredSquare() === index;
          const validation = validateSquarePlacement(index);
          const isValid = validation.isValid && !isSaving();
          
          // Check if two points are on the same restricted line
          const areOnSameLine = (x1: number, y1: number, x2: number, y2: number): boolean => {
            // Calculate relative position
            const dx = x2 - x1;
            const dy = y2 - y1;
            
            // If same point
            if (dx === 0 && dy === 0) return false;
            
            // Check if on same axis
            if (dx === 0 || dy === 0) return true;
            
            // Check if on diagonal
            if (dx === dy || dx === -dy) return true;
            
            // Check if on 2:1 or 1:2 slope
            if (dy === 2 * dx || dx === 2 * dy) return true;
            if (dy === -2 * dx || dx === -2 * dy) return true;
            
            return false;
          };
          
          // Check if this basepoint is on a restricted line from any other basepoint or origin
          const isOnRestrictedLine = (x: number, y: number): boolean => {
            // First check against origin (0,0)
            if (areOnSameLine(x, y, 0, 0)) return true;
            
            // Then check against other basepoints
            return basePoints().some(bp => {
              // Skip self
              if (bp.x === x && bp.y === y) return false;
              return areOnSameLine(x, y, bp.x, bp.y);
            });
          };

          // Determine the class based on state
          const squareClass = () => {
            const classes = [styles.square];
            if (isBP) {
              classes.push(styles.basePoint);
              if (isOnRestrictedLine(worldX, worldY)) {
                classes.push(styles.restricted);
              }
            }
            if (isSelected) {
              classes.push(styles.selected);
            }
            if (isPlayerPosition) classes.push(styles.playerPosition);
            if (isSaving() && isHovered) classes.push(styles.loading);
            else if (isHovered) {
              classes.push(isValid ? styles['valid-hover'] : styles['invalid-hover']);
            }
            return classes.join(' ');
          };

          return (
            <button
              class={squareClass()}
              onClick={() => {
                if (isSelected || isSaving()) return;
                handleSquareClick(squareIndex);
              }}
              onMouseEnter={() => handleSquareHover(index)}
              onMouseLeave={() => handleSquareHover(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                // Right click does nothing now
              }}
              disabled={isSaving()}
              title={isBP ? 'Base Point' : 
                     !validation.isValid ? validation.reason : 
                     'Left-click to add base point\nRight-click to select'}
            >
              {isBP ? (
                <div class={styles.basePointMarker} />
              ) : !isSelected ? (
                <div class={styles.emptyMarker}>×</div>
              ) : null}
            </button>
          );
        })}
      </div>
      {error() && (
        <div class={styles.errorMessage}>
          {error()}
        </div>
      )}
    </div>
  );
};

export default Board;
