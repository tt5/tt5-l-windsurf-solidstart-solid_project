import { Component, createEffect, createSignal, onMount, createResource } from 'solid-js';
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

// Type for the response when adding a base point
interface AddBasePointResponse extends ApiResponse<BasePoint> {}


const Board: Component = () => {
  
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { success, data } = await response.json();
        
        if (success) {
          const points = data?.basePoints || [];
          setBasePoints(points);
          setLastFetchTime(now);
          if (points.length > 0) setIsLoading(false);
        } else {
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
    const isArrowKey = (key: string): key is keyof typeof BOARD_CONFIG.DIRECTION_MAP => 
      key in BOARD_CONFIG.DIRECTION_MAP;
    
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
      
      // Check if there's a base point at this exact position
      // Note: The base points are already stored in relative coordinates
      return points.some(bp => {
        if (!bp || typeof bp.x !== 'number' || typeof bp.y !== 'number') {
          return false;
        }
        // The x,y coordinates passed in are already in world coordinates
        // and the base points are stored in relative coordinates
        const [playerX, playerY] = currentPosition();
        const relX = x - playerX;
        const relY = y - playerY;
        
        return Math.abs(bp.x - relX) < 0.001 && Math.abs(bp.y - relY) < 0.001;
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
      
      // Update position and base points
      setCurrentPosition(newPosition);
      setBasePoints(prev => 
        prev.map(bp => ({
          ...bp,
          x: bp.x + dx,
          y: bp.y + dy
        }))
      );
      
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
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          {!user() ? 'Waiting for user authentication...' : 'Fetching game data...'}
        </div>
      </div>
    );
  }
  
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
