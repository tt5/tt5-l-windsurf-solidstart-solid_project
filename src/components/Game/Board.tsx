import { Component, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import { useUserItems } from '../../hooks/useUserItems';
import Login from '../Auth/Login';
import styles from './Board.module.css';

type Direction = 'up' | 'down' | 'left' | 'right';

const Board: Component = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUser = user();
  
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

  // Predefined sets of square selections
  const predefinedSelections = [
    [0, 1, 2, 3],
    [5, 6, 7, 8],
    [10, 11, 12, 13],
    [15, 16, 17, 18],
    [20, 21, 22, 23],
    [25, 26, 27, 28],
    [30, 31, 32, 33],
    [35, 36, 37, 38],
    [40, 41, 42, 43],
    [45, 46, 47, 48]
  ];

  const handleRandomSelection = () => {
    const randomIndex = Math.floor(Math.random() * predefinedSelections.length);
    updateSquares([...predefinedSelections[randomIndex]]);
  };

  const handleDirection = (dir: Direction) => moveSquares(
    selectedSquares(), dir
  ).then(updateSquares).catch(console.error);
    
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
