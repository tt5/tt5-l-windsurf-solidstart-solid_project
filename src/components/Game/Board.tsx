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
  // Hooks
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State with explicit types
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>([...BOARD_CONFIG.DEFAULT_POSITION]);
  const [activeDirection, setActiveDirection] = createSignal<Direction | null>(null);
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [isSaving, setIsSaving] = createSignal<boolean>(false);
  const [isLoading, setIsLoading] = createSignal<boolean>(true);
  
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
    
    if (!isArrowKey(e.key)) return;
    
    e.preventDefault();
    const direction = BOARD_CONFIG.DIRECTION_MAP[e.key];
    setActiveDirection(direction);
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

  // Effect to fetch base points when the component mounts or when the user changes
  createEffect(() => {
    const currentUser = user(); // React to user changes
    console.log('User changed, fetching base points for:', currentUser?.username || 'no user');
    if (currentUser) {
      console.log('Calling fetchBasePoints...');
      fetchBasePoints()
        .then(() => console.log('fetchBasePoints completed'))
        .catch(err => console.error('Error in fetchBasePoints:', err));
    } else {
      console.log('No user, not fetching base points');
      setIsLoading(false);
    }
  });

  // Fetch base points for the current user
  const fetchBasePoints = async (): Promise<void> => {
    console.log('fetchBasePoints called');
    console.log('Current loading state before set:', isLoading());
    setIsLoading(true);
    console.log('Loading state after set:', isLoading());
    
    const currentUser = user(); // Get the latest user value
    console.log('Current user in fetchBasePoints:', currentUser?.username || 'none');
    
    if (!currentUser) {
      console.log('No current user, skipping base points fetch');
      setBasePoints([]);
      setIsLoading(false);
      return;
    }
    
    console.log('Fetching base points for user:', currentUser.id);
    
    try {
      const response = await fetch('/api/base-points', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Base points response:', responseData);
      
      // The API returns { basePoints: BasePoint[] }
      if (responseData && Array.isArray(responseData.basePoints)) {
        console.log(`Found ${responseData.basePoints.length} base points`);
        setBasePoints(responseData.basePoints);
      } else {
        // Fallback to default base points if the response is not in the expected format
        console.warn('Unexpected response format, using default base points');
        setBasePoints([{ x: 3, y: 3, value: 1 }]); // Center of 7x7 grid
      }
    } catch (error) {
      console.error('Error fetching base points:', error);
      // Fallback to default base points if there's an error
      setBasePoints([{ x: 3, y: 3, value: 1 }]); // Center of 7x7 grid
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effect to fetch base points when user changes
  createEffect(() => {
    fetchBasePoints().catch(() => {});
  });

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });
  
  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
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
      return false;
    }
  };

  // Fetch base points when user changes
  createEffect(() => {
    if (currentUser) {
      fetchBasePoints();
    } else {
      setBasePoints([]);
    }
  });

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
    if (!currentUser) return;
    
    // Calculate grid position from index
    const gridX = index % BOARD_CONFIG.GRID_SIZE;
    const gridY = Math.floor(index / BOARD_CONFIG.GRID_SIZE);
    
    // Calculate relative position from player
    const [playerX, playerY] = currentPosition();
    const relativeX = gridX - playerX;
    const relativeY = gridY - playerY;
    
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
    console.log("Calculating squares...", Date.now());
    
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
      
      // Then try to fetch from API
      const response = await fetch('/api/calculate-squares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to calculate border: ${response.status}`);
      }
      
      const res = await response.json();
      if (res?.squares) {
        return res;
      }
      
      // If response doesn't have squares, use fallback
      return { squares: fallbackSquares };
      
    } catch (error) {
      console.warn('Error calculating border, using fallback squares:', error);
      return { squares: fallbackSquares };
    }
  });

  // Update squares when border data changes
  createEffect(() => {
    const data = borderData();
    if (data?.squares) {
      updateSquares(data.squares);
    }
  });

  const handleDirection = (dir: Direction) => {
    const [x, y] = currentPosition();
    const newPosition: Point = [
      dir === 'left' ? x - 1 : dir === 'right' ? x + 1 : x,
      dir === 'up' ? y - 1 : dir === 'down' ? y + 1 : y
    ];
    
    return moveSquares(selectedSquares(), dir, [x, y])
      .then((squares) => {
        updateSquares(squares);
        setCurrentPosition(newPosition);
      })
      .catch(() => {});
  };


  // Show loading state while data is being fetched
  if (isLoading()) {
    console.log('Board - Showing loading state, isLoading:', isLoading());
    return (
      <div class={styles.loadingContainer}>
        <div class={styles.loadingSpinner}></div>
        <p>Loading game data...</p>
      </div>
    );
  } else {
    console.log('Board - Data loaded, rendering game board');
    console.log('Current user:', user()?.username);
    console.log('Base points:', basePoints());
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
          const isSelected = selectedSquares().includes(index);
          const isBP = isBasePoint(x, y);
          
          return (
            <button
              key={index}
              class={`${styles.square} ${isSelected ? styles.selected : ''} ${isBP ? styles.basePoint : ''}`}
              onClick={() => {
                // Don't add a base point if this square is already selected
                if (isSelected) {
                  return;
                }
                const [playerX, playerY] = currentPosition();
                handleAddBasePoint(x - playerX, y - playerY);
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
