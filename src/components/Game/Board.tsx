import { Component, createEffect, createResource, createSignal, For, onCleanup, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import { useUserItems } from '../../hooks/useUserItems';
import type { Direction, Item, Point } from '../../types/board';
import styles from './Board.module.css';

// Board configuration
const BOARD_CONFIG = {
  GRID_SIZE: 7, // 7x7 grid
  DEFAULT_POSITION: [0, 0] as Point,
  DIRECTION_MAP: {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right'
  } as const,
  BUTTONS: [
    { label: 'Random', className: 'randomButton' },
    { label: 'Clear All', className: 'clearButton' }
  ] as const,
  DIRECTIONS: [
    { key: 'up', label: '↑ Up' },
    { key: 'left', label: '← Left' },
    { key: 'right', label: 'Right →' },
    { key: 'down', label: '↓ Down' }
  ] as const
} as const;

interface BasePoint {
  id: number;
  x: number;
  y: number;
  userId: string;
}

const Board: Component = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>([...BOARD_CONFIG.DEFAULT_POSITION]);
  const [activeDirection, setActiveDirection] = createSignal<Direction | null>(null);
  const [basePoints, setBasePoints] = createSignal<BasePoint[]>([]);
  const [isSaving, setIsSaving] = createSignal(false);
  
  const resetPosition = () => setCurrentPosition([...BOARD_CONFIG.DEFAULT_POSITION]);
  
  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only process arrow keys
    if (!(e.key in BOARD_CONFIG.DIRECTION_MAP)) return;
    
    e.preventDefault();
    
    const direction = BOARD_CONFIG.DIRECTION_MAP[e.key as keyof typeof BOARD_CONFIG.DIRECTION_MAP];
    setActiveDirection(direction);
    handleDirection(direction);
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      setActiveDirection(null);
    }
  };
  
  // Add and remove event listeners
  // Fetch base points when user changes
  createEffect(async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/base-points?userId=${currentUser.id}`);
      if (response.ok) {
        const { basePoints } = await response.json();
        setBasePoints(basePoints || []);
      }
    } catch (error) {
      console.error('Error fetching base points:', error);
    }
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
  
  // Fetch base points for the current user
  const fetchBasePoints = async () => {
    if (!currentUser) {
      setBasePoints([]);
      return;
    }
    
    try {
      const response = await fetch('/api/base-points', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.basePoints)) {
          setBasePoints(data.basePoints);
        } else {
          setBasePoints([]);
        }
      }
    } catch {
      // Silently handle errors
    }
  };

  // Handle adding a new base point
  const handleAddBasePoint = async (x: number, y: number) => {
    if (!currentUser || isSaving()) return;
    
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
        throw new Error('Failed to save base point');
      }
      
      const responseData = await response.json();
      setBasePoints(prev => [...prev, responseData]);
    } catch {
      // Silently handle errors
    } finally {
      setIsSaving(false);
    }
  };

  // Check if a grid cell is a base point
  const isBasePoint = (x: number, y: number) => {
    try {
      const points = basePoints();
      if (!Array.isArray(points)) return false;
      
      const [playerX, playerY] = currentPosition();
      const relX = x - playerX;
      const relY = y - playerY;
      
      return points.some(bp => 
        bp && 
        typeof bp.x === 'number' && 
        typeof bp.y === 'number' && 
        bp.x === relX && 
        bp.y === relY
      );
    } catch {
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
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        await logout();
        navigate('/');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: relativeX,
          y: relativeY,
          userId: currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save base point');
      }
      
      const { basePoint } = await response.json();
      setBasePoints(prev => [...prev, basePoint]);
      
    } catch (error) {
      console.error('Error saving base point:', error);
    }
  };

  // Create a resource for the async border calculation
  const [borderData, { refetch: calculateBorder }] = createResource(async () => {
    const response = await fetch('/api/calculate-squares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        borderIndices: Array(BOARD_CONFIG.GRID_SIZE).fill(0).map((_, i) => i),
        currentPosition: currentPosition(),
        direction: 'right' // Default direction for initial selection
      })
    });
    
    if (!response.ok) throw new Error('Failed to calculate border');
    return response.json();
  });

  // Update squares when border data changes
  createEffect(() => {
    if (borderData()) {
      updateSquares(borderData().squares);
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
      .catch(console.error);
  };


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
                  console.log('Square is already selected, ignoring click');
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
