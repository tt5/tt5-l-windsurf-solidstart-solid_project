import { Component, createEffect, createSignal, onMount, createResource, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import { useUserItems } from '../../hooks/useUserItems';
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

// Type for the API response when fetching base points
interface BasePointsResponse extends ApiResponse<{ basePoints: BasePoint[] }> {}

// Type for the response when adding a base point
interface AddBasePointResponse extends ApiResponse<BasePoint> {}

// Type for the response when deleting an account
interface DeleteAccountResponse extends ApiResponse<{ success: boolean }> {}

const Board: Component = () => {
  console.log('Board - Component mounting...');
  
  // Hooks
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Log when user changes
  createEffect(() => {
    console.log('Board - Current user:', user());
  });
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>([...BOARD_CONFIG.DEFAULT_POSITION]);
  const [activeDirection, setActiveDirection] = createSignal<Direction | null>(null);
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  const [lastFetchTime, setLastFetchTime] = createSignal<number>(0);
  const [isFetching, setIsFetching] = createSignal<boolean>(false);
  
  // Cache key based on user ID
  const cacheKey = () => currentUser?.id ? `basePoints_${currentUser.id}` : '';
  
  // Initialize loading state on mount
  onMount(() => {
    console.log('Board - Component mounted, initializing state');
    setIsLoading(true);
    setBasePoints([]);
  });
  
  // Track the current fetch promise to prevent duplicate requests
  let currentFetch: Promise<void> | null = null;
  
  // Single effect to handle base points fetching
  createEffect(() => {
    const currentUser = user();
    console.log('Board - Auth effect triggered', { 
      hasUser: !!currentUser,
      userId: currentUser?.id,
      currentTime: new Date().toISOString()
    });
    
    // Clear state if no user
    if (!currentUser) {
      console.log('Board - No current user, clearing state');
      setBasePoints([]);
      setIsLoading(false);
      return;
    }
    
    // Don't fetch if already fetching or recently fetched
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime();
    const hasData = basePoints().length > 0;
    const shouldSkipFetch = isFetching() || currentFetch || (timeSinceLastFetch < 30000 && hasData);
    
    if (shouldSkipFetch) {
      console.log('Board - Skipping fetch:', { 
        isFetching: isFetching(),
        hasCurrentFetch: !!currentFetch,
        timeSinceLastFetch,
        lastFetchTime: lastFetchTime(),
        basePointsCount: basePoints().length
      });
      return;
    }
    
    // Only set loading state if we don't have any data yet
    if (!hasData) {
      console.log('Board - Starting initial data load');
      setIsLoading(true);
    }
    
    // Fetch base points with deduplication
    const fetchData = async () => {
      // If there's already a fetch in progress, wait for it
      if (currentFetch) {
        console.log('Board - Waiting for existing fetch to complete');
            await currentFetch;
            return;
          }
      
      console.log('Board - Starting base points fetch...');
      setIsFetching(true);
      
      try {
        // Create a new promise for this fetch
        currentFetch = (async () => {
          try {
            console.log('Board - Fetching base points from /api/base-points');
            const response = await fetch('/api/base-points', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            console.log('Board - Base points response status:', response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Board - Error response:', errorText);
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Board - Base points response data:', data);
            
            if (data.success) {
              const points = data.data?.basePoints || [];
              console.log(`Board - Setting ${points.length} base points`);
              setBasePoints(points);
              setLastFetchTime(now);
              
              // If we have points, we can clear the loading state
              if (points.length > 0) {
                console.log('Board - Clearing loading state after successful fetch');
                setIsLoading(false);
              }
            } else {
              console.warn('Board - API returned success:false', data);
              setBasePoints([]);
            }
          } finally {
            // Clear the current fetch promise when done
            currentFetch = null;
          }
        })();
        
        await currentFetch;
      } catch (error) {
        console.error('Error in base points fetch:', error);
        // Clear loading states on error
        setIsLoading(false);
        setIsFetching(false);
        currentFetch = null;
        
        // If we don't have any squares yet, ensure we show something
        if (selectedSquares().length === 0) {
          console.log('Board - Setting fallback squares after error');
          updateSquares([24]); // Fallback to center square
        }
      }
    };
    
    // Call fetchData and handle any uncaught errors
    fetchData().catch(error => {
      console.error('Unhandled error in fetchData:', error);
      setIsLoading(false);
      setIsFetching(false);
      currentFetch = null;
      
      if (selectedSquares().length === 0) {
        updateSquares([24]); // Fallback to center square
      }
    });
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
    console.log('Key pressed:', e.key);
    
    // Type guard to ensure we only handle arrow keys
    const isArrowKey = (key: string): key is keyof typeof BOARD_CONFIG.DIRECTION_MAP => 
      key in BOARD_CONFIG.DIRECTION_MAP;
    
    if (!isArrowKey(e.key)) {
      console.log('Not an arrow key, ignoring');
      return;
    }
    
    console.log('Arrow key detected, preventing default');
    e.preventDefault();
    const direction = BOARD_CONFIG.DIRECTION_MAP[e.key];
    console.log('Setting active direction to:', direction);
    setActiveDirection(direction);
    console.log('Calling handleDirection with:', direction);
    handleDirection(direction);
  };
  
  const handleKeyUp: KeyboardHandler = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      setActiveDirection(null);
    }
  };
  
  // Setup and cleanup event listeners
  onMount(() => {
    const eventListeners: [string, EventListener][] = [
      ['keydown', handleKeyDown as EventListener],
      ['keyup', handleKeyUp as EventListener]
    ];
    
    eventListeners.forEach(([event, handler]) => {
      window.addEventListener(event, handler);
    });
    
    return () => {
      eventListeners.forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  });

  const {
    selectedSquares,
    updateSquares,
  } = useUserItems(currentUser, { onClear: resetPosition });

  // Handle adding a new base point with proper typing and error handling
  const handleAddBasePoint = async (x: number, y: number): Promise<boolean> => {
    if (!currentUser || isSaving()) return false;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/base-points', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ x, y })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save base point: ${response.status} ${errorText}`);
      }
      
      const responseData: AddBasePointResponse = await response.json();
      
      if (responseData.success && responseData.data) {
        setBasePoints(prev => [...prev, responseData.data as BasePoint]);
        return true;
      } else {
        throw new Error(responseData.error || 'Unknown error saving base point');
      }
    } catch (error) {
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Check if a grid cell is a base point
  const isBasePoint = (x: number, y: number) => {
    try {
      const points = basePoints();
      if (!Array.isArray(points)) {
        return false;
      }
      
      const [playerX, playerY] = currentPosition();
      // Calculate the relative position from the player's perspective
      const relX = x - playerX;
      const relY = y - playerY;
      
      // Check if there's a base point at this relative position
      return points.some(bp => {
        if (!bp || typeof bp.x !== 'number' || typeof bp.y !== 'number') {
          return false;
        }
        return bp.x === relX && bp.y === relY;
      });
    } catch (error) {
      console.error('Error in isBasePoint:', error);
      return false;
    }
  };

  const handleDeleteAccount = async () => {
    const userId = currentUser && 'id' in currentUser ? currentUser.id : currentUser;
    if (!userId) return;
    
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      const responseData: DeleteAccountResponse = await response.json();
      
      if (responseData.success) {
        await logout();
        navigate('/');
      } else {
        throw new Error(responseData.error || 'Failed to delete account');
      }
    } catch (error) {
      alert('Failed to delete account. Please try again.');
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
    console.log("Board - Starting border calculation...", Date.now());
    
    // Log the current state
    console.log('Board - Current position:', currentPosition());
    console.log('Board - Current user:', user()?.username);
    
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
      
      console.log('Board - Fetching border data from API...');
      const response = await fetch('/api/calculate-squares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      console.log('Board - Border API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Board - Error response from border API:', errorText);
        throw new Error(`Failed to calculate border: ${response.status} - ${errorText}`);
      }
      
      const res = await response.json();
      console.log('Board - Border API response data:', res);
      
      // Handle the new response format with success and data wrapper
      if (res?.success && res.data?.squares) {
        console.log('Board - Using squares from API response (new format)');
        return { squares: res.data.squares };
      } else if (res?.squares) {
        // Fallback for old response format
        console.log('Board - Using squares from API response (old format)');
        return { squares: res.squares };
      }
      
      // If response doesn't have squares, use fallback
      console.log('Board - No squares in response, using fallback');
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
      console.log('Skipping border data update during manual operation');
      return;
    }
    
    const data = borderData();
    const currentState = borderData.state;
    const currentSquares = selectedSquares();
    
    console.log('Board - Border data state update:', {
      state: currentState,
      hasData: !!data,
      hasSquares: data?.squares?.length > 0,
      currentSquaresLength: currentSquares.length,
      isLoading: isLoading(),
      isFetching: isFetching()
    });

    switch (currentState) {
      case 'ready':
        if (data?.squares) {
          // Only update if we don't have any squares yet
          if (currentSquares.length === 0) {
            console.log('Board - Initializing squares from border data');
            updateSquares(data.squares);
          } else {
            console.log('Board - Skipping border data update - manual changes detected');
          }
        }
        // Clear loading states
        if (isLoading() || isFetching()) {
          console.log('Board - Clearing loading states (ready state)');
          setIsLoading(false);
          setIsFetching(false);
        }
        break;
        
      case 'errored':
        console.warn('Board - Border data error, using fallback');
        // Ensure we have some squares to display
        if (currentSquares.length === 0) {
          console.log('Board - Setting fallback squares');
          updateSquares([24]); // Fallback to center square
        }
        // Clear loading states
        setIsLoading(false);
        setIsFetching(false);
        break;
        
      case 'pending':
        // Only set loading if we don't have any squares yet
        if (currentSquares.length === 0) {
          console.log('Board - Setting initial loading state');
          setIsLoading(true);
        }
        break;
    }
  });
  
  // Log loading state changes
  createEffect(() => {
    console.log('Board - isLoading:', isLoading());
  });

  const handleDirection = (dir: Direction) => {
    console.log('handleDirection called with direction:', dir);
    
    // Set manual update flag
    setIsManualUpdate(true);
    
    try {
      // Get current state
      const [x, y] = currentPosition();
      const currentSquareIndices = [...selectedSquares()];
      
      console.log('Current position:', [x, y], 'Current squares:', currentSquareIndices);
      
      // Calculate new position
      const newPosition: Point = [
        dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x,
        dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y
      ];
      
      console.log('New position will be:', newPosition);
      
      // Update the position
      setCurrentPosition(newPosition);
      
      // Add loading state for better UX
      setIsLoading(true);
      
      console.log('Calling moveSquares with:', {
        currentSquareIndices,
        dir,
        newPosition
      });
      
      // Convert indices to coordinates for moveSquares
      const squaresAsCoords = currentSquareIndices.map(index => {
        const x = index % BOARD_CONFIG.GRID_SIZE;
        const y = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
        return [x, y] as [number, number];
      });
      
      console.log('Squares as coordinates before moveSquares:', squaresAsCoords);
      
      // Move the squares with the current squares and new position
      return moveSquares(squaresAsCoords, dir, newPosition)
        .then((squares) => {
          console.log('moveSquares returned with squares:', squares);
          if (Array.isArray(squares)) {
            // Convert [x, y] coordinates back to indices
            const newIndices = squares.map(([x, y]) => y * BOARD_CONFIG.GRID_SIZE + x);
            console.log('Converted new indices:', newIndices);
            updateSquares(newIndices);
            console.log('After updateSquares, selectedSquares:', [...selectedSquares()]);
            return newIndices; // Return for testing
          } else {
            throw new Error('Invalid squares array received from moveSquares');
          }
        });
    } catch (error) {
      console.error('Error in handleDirection:', error);
      throw error;
    } finally {
      console.log('handleDirection completed, setting loading to false');
      setIsLoading(false);
      
      // Reset manual update flag after a small delay to allow UI to update
      setTimeout(() => {
        console.log('Resetting manual update flag');
        setIsManualUpdate(false);
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
  
  // Log rendering state for debugging
  console.log('Board - Rendering check:', {
    isLoading: isLoading(),
    isFetching: isFetching(),
    borderDataState: borderData.state,
    hasSquares: selectedSquares().length > 0,
    showLoading: showLoading()
  });

  // Show loading state if needed
  if (showLoading()) {
    return (
      <div class={styles.loadingContainer}>
        <div class={styles.loadingSpinner}></div>
        <p>Loading game data...</p>
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {!user() ? 'Waiting for user authentication...' : 'Fetching game data...'}
        </div>
      </div>
    );
  }
  
  console.log('Board - Data loaded, rendering game board', {
    currentUser: user()?.username,
    basePointsCount: basePoints().length,
    selectedSquaresCount: selectedSquares().length,
    lastFetchTime: lastFetchTime()
  });

  return (
    <div class={styles.board}>
      <div class={styles.userBar}>
        <span>Welcome, {user()?.username || 'User'}!</span>
        <div style={{ 'display': 'flex', 'gap': '1rem', 'margin-top': '1rem' }}>
          <button onClick={logout} class={styles.button}>
            Logout
          </button>
          <button 
            onClick={handleDeleteAccount} 
            class={styles.button}
            style={{ 'background-color': '#dc3545' }}
          >
            Delete Account
          </button>
        </div>
      </div>
      
      <div class={styles.grid}>
        {Array.from({ length: BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE }).map((_, index) => {
          const x = index % BOARD_CONFIG.GRID_SIZE;
          const y = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
          const [offsetX, offsetY] = currentPosition();
          const worldX = x + offsetX;
          const worldY = y + offsetY;
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
