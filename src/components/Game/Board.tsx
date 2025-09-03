import { Component, For, Show, createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import { useUserItems } from '../../hooks/useUserItems';
import type { Item } from '../../types/board';
import Login from '../Auth/Login';
import styles from './Board.module.css';

type Direction = 'up' | 'down' | 'left' | 'right';

type Point = [number, number];

const Board: Component = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUser = user();
  const [currentPosition, setCurrentPosition] = createSignal<Point>([0, 0]);
  
  const {
    items,
    selectedSquares,
    updateSquares,
    handleSave,
    handleClear,
  } = useUserItems(currentUser);
  
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

  const toggleSquare = (i: number) => {
    const update = selectedSquares().includes(i) 
      ? selectedSquares().filter(j => j !== i)
      : [...selectedSquares(), i];
    updateSquares(update);
  };

  const basePoints = [[0,0], [2,3]]

  const generateSelection = (x: number, y: number) => {
    const borderIndices = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]]
    return borderIndices.map(([i,j]) => i + j + x + y)
  };

  // Predefined sets of square selections
  const predefinedSelections = () => {
    const selection = basePoints.map(([x,y]) => generateSelection(x, y));
    return selection;
  }

  const handleRandomSelection = () => {
    const selections = predefinedSelections();
    const randomIndex = Math.floor(Math.random() * selections.length);
    updateSquares([...selections[randomIndex]]);
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
    
  const buttons = [
    ['Random', handleRandomSelection, styles.randomButton],
    ['Clear All', handleClear, styles.clearButton]
  ] as const;

  const directions = [
    ['up', '↑ Up', styles.directionButton],
    ['left', '← Left', styles.directionButton],
    ['right', 'Right →', styles.directionButton],
    ['down', '↓ Down', styles.directionButton]
  ] as const;

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
          {buttons.map(([label, onClick, className]) => (
            <button {...{class: className, onClick, children: label}} />
          ))}
          <div class={styles.directionGroup}>
            {directions.map(([dir, label, className]) => (
              <button 
                {...{
                  class: className,
                  onClick: () => handleDirection(dir as Direction),
                  children: label
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        {Array(49).fill(0).map((_, i) => (
          <button 
            onClick={() => toggleSquare(i)}
            class={`${styles.square} ${selectedSquares().includes(i) ? styles.selected : ''}`}
            aria-pressed={selectedSquares().includes(i)}
            children={
              <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r="40" fill={selectedSquares().includes(i) ? '#FFD700' : 'transparent'} stroke="#333"/>
              </svg>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
