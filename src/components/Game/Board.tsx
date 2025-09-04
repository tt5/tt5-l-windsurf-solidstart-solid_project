import { Component, createSignal, For, onCleanup, onMount } from 'solid-js';
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

const Board: Component = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>([...BOARD_CONFIG.DEFAULT_POSITION]);
  const [activeDirection, setActiveDirection] = createSignal<Direction | null>(null);
  
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
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  });
  
  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  });

  const {
    items,
    selectedSquares,
    updateSquares,
    handleSave,
    handleClear,
  } = useUserItems(currentUser, { onClear: resetPosition });
  
  const handleDeleteAccount = async () => {
    const userId = currentUser && 'id' in currentUser ? currentUser.id : currentUser;
    if (!userId) return;
    
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error('Failed to delete account');
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const toggleSquare = (index: number) => {
    const update = selectedSquares().includes(index) 
      ? selectedSquares().filter(i => i !== index)
      : [...selectedSquares(), index];
    updateSquares(update);
  };

  const generateSelection = (x: number, y: number) => {
    return Array.from(
      { length: BOARD_CONFIG.GRID_SIZE },
      (_, i) => x + (y + i) * BOARD_CONFIG.GRID_SIZE
    );
  };

  const handleRandomSelection = async () => {
    try {
      const response = await fetch('/api/calculate-squares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borderIndices: Array(BOARD_CONFIG.GRID_SIZE).fill(0).map((_, i) => i),
          currentPosition: currentPosition(),
          direction: 'right' // Default direction for initial selection
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch random selection');
      const { squares } = await response.json();
      updateSquares(squares);
    } catch (error) {
      console.error('Error in handleRandomSelection:', error);
    }
  };

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
    
  const buttonHandlers = {
    'Random': handleRandomSelection,
    'Clear All': handleClear
  } as const;

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
      <div class={styles.history}>
        <h2>Current Position: x: {currentPosition()[0]} y: {currentPosition()[1]}</h2>
        <h2>Selected Items History</h2>
        <ul class={styles.historyList}>
          <For each={items()}>{
            (item: Item) => <li class={styles.historyItem}>{item.data}</li>
          }</For>
        </ul>
        
        <div class={styles.controls}>
          {BOARD_CONFIG.BUTTONS.map(({ label, className }) => (
            <button 
              key={label}
              class={`${styles[className]}`}
              onClick={buttonHandlers[label]}
            >
              {label}
            </button>
          ))}
          <div class={styles.directionGroup}>
            {BOARD_CONFIG.DIRECTIONS.map(({ key, label }) => (
              <button
                key={key}
                class={`${styles.directionButton} ${activeDirection() === key ? styles.active : ''}`}
                onClick={() => handleDirection(key)}
                aria-label={`Move ${key}`}
                data-direction={key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        {Array(BOARD_CONFIG.GRID_SIZE * BOARD_CONFIG.GRID_SIZE).fill(0).map((_, index) => {
          const isSelected = selectedSquares().includes(index);
          return (
            <button 
              key={index}
              onClick={() => toggleSquare(index)}
              class={`${styles.square} ${isSelected ? styles.selected : ''}`}
              aria-pressed={isSelected}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill={isSelected ? '#FFD700' : 'transparent'} 
                  stroke="#333"
                />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
