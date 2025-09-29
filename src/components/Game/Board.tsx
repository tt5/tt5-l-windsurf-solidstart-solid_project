import { 
  type Component, 
  createEffect, 
  createSignal, 
  createMemo,
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
  validateSquarePlacement,
  indicesToPoints,
  pointsToIndices,
  gridToWorld
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
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  
  // Get position and restricted squares from context
  const { 
    position,
    setPosition: setContextPosition,
    restrictedSquares: getRestrictedSquares,
    setRestrictedSquares
  } = usePlayerPosition();
  
  // Create a memoized version of the current position to avoid recreating it
  const currentPos = createMemo<Point>(() => position() || createPoint(0, 0));
  
  // Other state variables
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0); // base points, rate limiting
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  const [isMoving, setIsMoving] = createSignal<boolean>(false);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  
  // Initialize board on mount
  onMount(async () => {
    // Set up CSS variable for grid size
    document.documentElement.style.setProperty('--grid-size', BOARD_CONFIG.GRID_SIZE.toString());
    
    try {
      // If we don't have a position yet, try to jump to the default position
      if (!position()) {
        console.log('No position set, jumping to default position');
        const result = await jumpToPosition(
          BOARD_CONFIG.DEFAULT_POSITION[0],
          BOARD_CONFIG.DEFAULT_POSITION[1],
          setContextPosition  // Pass the setPosition function
        );
        
        if (!result) {
          throw new Error('Failed to jump to default position. The game cannot start without a valid position.');
        } else {
          const { restrictedSquares } = result;
          setRestrictedSquares(restrictedSquares);
        }
      }
      
      // Fetch base points with the current position
      await fetchBasePoints();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize game: ${error.message}`);
      } else {
        throw new Error('Failed to initialize game: Unknown error occurred');
      }
    }
  });

  const [hoveredSquare, setHoveredSquare] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [reachedBoundary, setReachedBoundary] = createSignal<boolean>(false);
  
  // Validate if a square can have a base point
  const validateSquarePlacementLocal = (index: number) => {
    const pos = position();
    if (!pos) return { isValid: false, reason: 'Position not initialized' };
    
    return validateSquarePlacement({
      index,
      currentUser,
      currentPosition: pos,
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
    const currentPos = position();
    if (!currentPos) return Promise.resolve();
    
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
    const currentPos = position();
    const currentUser = user();
    
    // Skip if we don't have a position or user
    if (!currentPos || !currentUser) return;
    
    const [x, y] = currentPos;
    console.log(`[Board] Effect - Position changed to [${x}, ${y}], fetching base points`);
    
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
    const pos = position();
    if (!pos) return;
    
    const [gridX, gridY] = indicesToPoints([index])[0];
    const [offsetX, offsetY] = pos;
    const [worldX, worldY] = gridToWorld(gridX, gridY, offsetX, offsetY);

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
        const pos = position();
        if (pos) {
          const newRestrictedSquares = calculateRestrictedSquares(
            createPoint(worldX, worldY),
            getRestrictedSquares(),
            pos
          );
          setRestrictedSquares(newRestrictedSquares);
        }
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
    
    const current = currentPos(); // Call the accessor to get the current position
    if (!current) return;
    
    const [dx, dy] = DIRECTION_MAP[dir].delta;
    const newX = current[0] + dx;
    const newY = current[1] + dy;
    
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
    
    try {
      await handleDirectionUtil(dir, {
        isMoving,
        currentPosition: () => current,
        setCurrentPosition: (value: Point) => {
          setContextPosition(value);
          return value;
        },
        restrictedSquares: getRestrictedSquares,
        setRestrictedSquares,
        setIsMoving,
      });
    } catch (error) {
      console.error('Error in handleDirection:', error);
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
        Position: ({position()?.[0] ?? 0}, {position()?.[1] ?? 0})
      </div>
      <div class={styles.grid}>
        {Array.from({ length: BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE }).map((_, index) => {

          const pos = currentPos();
          if (!pos) return null; // Skip rendering if position is not yet set
          const [x, y] = indicesToPoints([index])[0];
          const [offsetX, offsetY] = pos;
          const [worldX, worldY] = gridToWorld(x, y, offsetX, offsetY);
          const isBP = isBasePoint(worldX, worldY, basePoints());

          const isSelected = getRestrictedSquares().includes(index);
          
          const cellState = {
            isBasePoint: isBP,
            isSelected,
            isHovered: hoveredSquare() === index,
            isValid: validateSquarePlacementLocal(index).isValid && !isSaving(),
            isSaving: isSaving()
          };

          return (
            <GridCell
              state={cellState}
              onHover={(hovered: boolean) => {
                if (hovered) {
                  handleSquareHover(y * BOARD_CONFIG.GRID_SIZE + x);
                } else {
                  handleSquareHover(null);
                }
              }}
              onClick={() => {
                if (!isSelected && !isSaving() && !isBP) {
                  handleSquareClick(index)
                    .catch(err => console.error('Error processing click:', err));
                }
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
