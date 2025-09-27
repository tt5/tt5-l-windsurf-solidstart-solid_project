import { 
  type Component, 
  createEffect, 
  createSignal, 
  onMount,
  on
} from 'solid-js';
import { GridCell } from './GridCell';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerPosition } from '../../contexts/PlayerPositionContext';
import { jumpToPosition } from '../../lib/utils/navigation';
import { 
  type Direction, 
  type Point, 
  type BasePoint,
  createPoint
} from '../../types/board';
import { 
  calculateRestrictedSquares, 
  fetchBasePoints as fetchBasePointsUtil, 
  handleDirection as handleDirectionUtil,
  handleAddBasePoint,
  isBasePoint,
  validateSquarePlacement
} from '../../utils/boardUtils';
import styles from './Board.module.css';

// Import shared board configuration
import { BOARD_CONFIG } from '~/constants/game';
import { DIRECTION_MAP } from '~/utils/directionUtils';

const Board: Component = () => {
  
  // Hooks
  const { user } = useAuth();
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>(createPoint(BOARD_CONFIG.DEFAULT_POSITION[0], BOARD_CONFIG.DEFAULT_POSITION[1]));
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  
  // Track if position update is from context or local
  const positionUpdateSource = { fromContext: false };
  
  // Sync position with context on mount and when context position changes
  createEffect(() => {
    const contextPos = position();
    if (contextPos && !positionUpdateSource.fromContext) {
      const [cx, cy] = contextPos;
      const [px, py] = currentPosition();
      if (cx !== px || cy !== py) {
        console.log(`[Board] Syncing position from context: [${cx}, ${cy}]`);
        setCurrentPosition(createPoint(cx, cy));
      }
    }
  });
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0); // base points, rate limiting
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  const [isMoving, setIsMoving] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  // Get position and restricted squares from context
  const { 
    position,
    setPosition: setContextPosition,
    restrictedSquares: getRestrictedSquares,
    setRestrictedSquares
  } = usePlayerPosition();
  
  // Initialize board on mount
  onMount(async () => {
    // Set up CSS variable for grid size
    document.documentElement.style.setProperty('--grid-size', BOARD_CONFIG.GRID_SIZE.toString());
    
    try {
      // Try to get position from URL or other source
      const result = await jumpToPosition(
        BOARD_CONFIG.DEFAULT_POSITION[0],
        BOARD_CONFIG.DEFAULT_POSITION[1],
        setContextPosition  // Pass the setPosition function
      );
      
      if (!result) {
        throw new Error('Failed to initialize game: Could not determine starting position');
      }
      
      const { position, restrictedSquares } = result;
      
      // Update state with position and restricted squares
      setCurrentPosition(position);
      setRestrictedSquares(restrictedSquares);
      
      // Now that we have a position, fetch base points
      await fetchBasePoints();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize game: ${error.message}`);
      } else {
        throw new Error('Failed to initialize game: Unknown error occurred');
      }
    }
  });

  // Use restricted squares from context
  const [hoveredSquare, setHoveredSquare] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [reachedBoundary, setReachedBoundary] = createSignal<boolean>(false);
  
  // Validate if a square can have a base point
  const validateSquarePlacementLocal = (index: number) => {
    return validateSquarePlacement({
      index,
      currentUser,
      currentPosition: currentPosition(),
      basePoints: basePoints(),
      restrictedSquares: getRestrictedSquares()
    });
  };

  // Handle square hover
  const handleSquareHover = (index: number | null) => {
    setHoveredSquare(index);
    if (index === null) {
      setError(null);
    } else {
      const validation = validateSquarePlacementLocal(index);
      if (!validation.isValid) {
        setError(validation.reason || 'Invalid placement');
      } else {
        setError(null);
      }
    }
  };
  
  // Track the current fetch promise to prevent duplicate requests
  let currentFetch: Promise<void> | null = null;
  
  // Fetch base points with proper error handling and loading states
  const fetchBasePoints = async () => {
    // Get the current position value at the time of the call
    const currentPos = currentPosition();
    
    const promise = fetchBasePointsUtil({
      user: () => currentUser,
      currentPosition: () => currentPos, // Use the captured position
      lastFetchTime,
      isFetching,
      setBasePoints,
      setLastFetchTime,
      setIsFetching
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
    (currentUser) => {
      if (currentUser === undefined) return;
      
      // Clear state on logout
      if (!currentUser) {
        setRestrictedSquares([]);
        return;
      }
      
      // Only fetch base points on login
      fetchBasePoints().catch(console.error);
    },
    { defer: true }
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
  
  const handleSquareClick = async (index: number) => {
    // Calculate grid position from index
    const gridX = index % BOARD_CONFIG.GRID_SIZE;
    const gridY = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
    const [offsetX, offsetY] = currentPosition();
    const worldX = gridX - offsetX;
    const worldY = gridY - offsetY;

    try {
      const response = await handleAddBasePoint({
        x: worldX,
        y: worldY,
        currentUser,
        isSaving,
        setIsSaving,
        setBasePoints,
        isBasePoint: (x: number, y: number) => isBasePoint(x, y, basePoints())
      });
      
      if (response.success && response.data) {
        
        // Recalculate restricted squares with the new base point
        const newRestrictedSquares = calculateRestrictedSquares(
          createPoint(worldX, worldY),
          getRestrictedSquares(),
          currentPosition()
        );
        setRestrictedSquares(newRestrictedSquares);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  };

  // Handle direction movement
  const handleDirection = async (dir: Direction): Promise<void> => {
    setReachedBoundary(false); // Reset boundary flag on new movement
    
    const currentPos = currentPosition();
    const [dx, dy] = DIRECTION_MAP[dir].delta;
    const newX = currentPos[0] + dx;
    const newY = currentPos[1] + dy;
    const newPosition = createPoint(newX, newY);
    
    // Check boundaries
    if (
      newX < BOARD_CONFIG.WORLD_BOUNDS.MIN_X || 
      newX > BOARD_CONFIG.WORLD_BOUNDS.MAX_X || 
      newY < BOARD_CONFIG.WORLD_BOUNDS.MIN_Y || 
      newY > BOARD_CONFIG.WORLD_BOUNDS.MAX_Y
    ) {
      setReachedBoundary(true);
      return;
    }
    
    let positionUpdated = false;
    
    // Don't update position here - let handleDirectionUtil handle it
    positionUpdated = false;
    
    try {
      await handleDirectionUtil(dir, {
        isMoving,
        currentPosition: () => currentPosition(),
        setCurrentPosition: (value: Point | ((prev: Point) => Point)) => {
          if (positionUpdated) {
            console.warn('Position already updated, ignoring duplicate update');
            return newPosition;
          }
          const updatedValue = typeof value === 'function' ? value(currentPosition()) : value;
          setCurrentPosition(updatedValue);
          setContextPosition(updatedValue);
          positionUpdated = true;
        },
        restrictedSquares: getRestrictedSquares,
        setRestrictedSquares,
        setIsMoving,
        isBasePoint: (x: number, y: number) => isBasePoint(x, y, basePoints())
      });
    } catch (error) {
      // Revert position if there was an error
      setCurrentPosition(currentPosition());
      setContextPosition(currentPosition());
      throw error;
    }
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
          const isBP = isBasePoint(worldX, worldY, basePoints());
          const isSelected = getRestrictedSquares().includes(squareIndex);
          
          const cellState = {
            isBasePoint: isBP,
            isSelected,
            isPlayerPosition: worldX === 0 && worldY === 0,
            isHovered: hoveredSquare() === index,
            isValid: validateSquarePlacementLocal(index).isValid && !isSaving(),
            isSaving: isSaving()
          };

          const position = { x, y, worldX, worldY };

          return (
            <GridCell
              position={position}
              state={cellState}
              onHover={(hovered: boolean) => {
                if (hovered) {
                  handleSquareHover(y * BOARD_CONFIG.GRID_SIZE + x);
                } else {
                  handleSquareHover(null);
                }
              }}
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (isSelected || isSaving() || isBP) {
                  return;
                }
                
                handleSquareClick(squareIndex)
                  .catch(err => console.error('Error processing click:', err));
              }}
            />
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
