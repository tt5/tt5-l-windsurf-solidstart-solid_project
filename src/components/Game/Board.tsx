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
import { useFetchBasePoints } from '../../hooks/useFetchBasePoints';
import { useDirectionHandler } from '../../hooks/useDirectionHandler';
import { 
  type Direction, 
  type Point, 
  type BasePoint,
  createPoint
} from '../../types/board';
import { 
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
  
  // Get position and restricted squares from context
  const { 
    position,
    setPosition: setContextPosition,
    restrictedSquares: getRestrictedSquares,
    setRestrictedSquares
  } = usePlayerPosition();
  
  // Create a memoized version of the current position to avoid recreating it
  const currentPos = createMemo<Point>(() => position() || createPoint(0, 0));
  
  // State variables
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  
  // Direction handling
  const { isMoving, handleDirection } = useDirectionHandler({
    position,
    setPosition: setContextPosition,
    getRestrictedSquares,
    setRestrictedSquares,
  });
  
  // Base points fetching
  const { 
    basePoints, 
    fetchBasePoints, 
  } = useFetchBasePoints({
    user,
    currentPosition: () => position() || [0, 0]
  });
  
  // Initialize board on mount
  onMount(async () => {
    // Set up CSS variable for grid size
    document.documentElement.style.setProperty('--grid-size', BOARD_CONFIG.GRID_SIZE.toString());
    
    try {
      // If we don't have a position yet, try to jump to the default position
      if (!position()) {
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
  
  // Wrapper to handle the fetch with error handling
  const handleFetchBasePoints = async () => {
    try {
      await fetchBasePoints();
    } catch (error) {
      console.error('Error in fetchBasePoints:', error);
    }
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
      handleFetchBasePoints();
    },
    { defer: true }
  ));

  // Effect to handle position changes and fetch base points
  createEffect(() => {
    const currentPos = position();
    const currentUser = user();
    
    // Skip if we don't have a position or user
    if (!currentPos || !currentUser) return;
    
    // Use requestIdleCallback to batch the fetch with the position update
    const id = requestIdleCallback(() => {
      handleFetchBasePoints();
    });
    
    return () => cancelIdleCallback(id);
  });
  // Event handler types
  type KeyboardHandler = (e: KeyboardEvent) => void;
  
  // Handle keyboard events with proper type safety
  const handleKeyDown: KeyboardHandler = (e) => {
    // Check if the key is in our custom direction map
    if (e.key in BOARD_CONFIG.DIRECTION_MAP) {
      e.preventDefault();
      const direction = BOARD_CONFIG.DIRECTION_MAP[e.key as keyof typeof BOARD_CONFIG.DIRECTION_MAP];
      handleDirectionWithBoundary(direction);
    }
    // Check if the key is in the standard direction map
    else if (e.key in DIRECTION_MAP) {
      e.preventDefault();
      // Get the direction from the key
      const direction = e.key as keyof typeof DIRECTION_MAP;
      handleDirectionWithBoundary(direction);
    }
  };
  
  // Setup and cleanup event listeners
  onMount(() => {
    const eventListeners: [string, EventListener][] = [
      ['keydown', handleKeyDown as EventListener],
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
    if (isSaving()) return;
    
    const pos = position();
    if (!pos) return;
    
    const [gridX, gridY] = indicesToPoints([index])[0];
    const [offsetX, offsetY] = pos;
    const [worldX, worldY] = gridToWorld(gridX, gridY, offsetX, offsetY);
    
    setIsSaving(true);
    
    try {
      const result = await handleAddBasePoint({
        x: worldX,
        y: worldY,
        currentUser,
        setIsSaving,
        setBasePoints: (value: BasePoint[] | ((prev: BasePoint[]) => BasePoint[])) => {
          // This will trigger a re-fetch of base points through the effect
          handleFetchBasePoints();
          return value;
        },
        isBasePoint: (x: number, y: number) => isBasePoint(x, y, basePoints())
      });
      
      if (result.success) {
        // Refresh base points after successful addition
        await handleFetchBasePoints();
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error adding base point:', error);
      setError('Failed to add base point');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle direction movement with boundary checking
  const handleDirectionWithBoundary = async (dir: Direction): Promise<void> => {
    const current = currentPos();
    const [dx, dy] = DIRECTION_MAP[dir].delta;
    const newX = current[0] + dx;
    const newY = current[1] + dy;
    
    if (
      newX < BOARD_CONFIG.WORLD_BOUNDS.MIN_X || 
      newX > BOARD_CONFIG.WORLD_BOUNDS.MAX_X || 
      newY < BOARD_CONFIG.WORLD_BOUNDS.MIN_Y || 
      newY > BOARD_CONFIG.WORLD_BOUNDS.MAX_Y
    ) {
      setReachedBoundary(true);
      return;
    }
    
    await handleDirection(dir);
  };

  return (
    <div class={styles.board}>
      {reachedBoundary() && (
        <div class={styles.boundaryMessage}>
          You've reached the edge of the world!
        </div>
      )}
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
                handleSquareClick(index)
                  .catch(err => {
                    console.error('Error processing click:', err);
                    setError('Failed to process your action. Please try again.');
                  });
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
