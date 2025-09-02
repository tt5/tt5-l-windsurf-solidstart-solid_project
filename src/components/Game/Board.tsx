import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { query, createAsync, action, useAction, useNavigate } from '@solidjs/router';
import type { Item, SelectedSquares } from '../../types/board';
import { fetchUserItems, saveUserItems, clearUserItems } from '../../services/boardService';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import Login from '../Auth/Login';
import styles from './Board.module.css';

type Direction = 'up' | 'down' | 'left' | 'right';

// Server actions - updated to use user-specific endpoints
const getItems = query(async (user: string | { id: string }) => {
  const userId = typeof user === 'string' ? user : user.id;
  console.log('Fetching items for user ID:', userId);
  return fetchUserItems(userId);
}, 'userItems');

const refetchItems = action(({ userId, data }: { userId: string | { id: string }; data: SelectedSquares }) => {
  const id = typeof userId === 'string' ? userId : userId.id;
  return saveUserItems(id, JSON.stringify(data));
}, 'refetchUserItems');

const deleteItems = action((userId: string | { id: string }) => {
  const id = typeof userId === 'string' ? userId : userId.id;
  return clearUserItems(id);
}, 'deleteUserItems');

const Board: Component = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleDeleteAccount = async () => {
    if (!user()) return;
    
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user()!.id })
      });
      
      if (!response.ok) throw new Error('Failed to delete account');
      
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };
  const currentUser = user();
  
  // Initialize with empty array if no items exist
  const [items, setItems] = createSignal<Item[]>([]);
  
  // Load items when user changes
  createEffect(() => {
    console.log('Current user changed:', currentUser);
    if (!currentUser) {
      console.log('No current user, clearing items');
      setItems([]);
      setSelectedSquares([]);
      return;
    }
    
    const userId = typeof currentUser === 'string' ? currentUser : currentUser.id;
    console.log('Fetching items for user:', userId);
    
    getItems(userId)
      .then(data => {
        console.log('Fetched items:', data);
        setItems(data);
        
        // If there are saved items, load the most recent one into selectedSquares
        if (data.length > 0) {
          try {
            const lastItem = data[0]; // Most recent item is first
            const squares = JSON.parse(lastItem.data);
            console.log('Setting selected squares from saved data:', squares);
            setSelectedSquares(Array.isArray(squares) ? squares : []);
          } catch (error) {
            console.error('Error parsing saved squares:', error);
            setSelectedSquares([]);
          }
        } else {
          setSelectedSquares([]);
        }
      })
      .catch(error => {
        console.error('Error loading user items:', error);
        setSelectedSquares([]);
      });
  });

  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  const saveAction = useAction(refetchItems);
  const deleteAction = useAction(deleteItems);

  const updateSquares = (squares: SelectedSquares) => {
    if (!currentUser) return;
    setSelectedSquares(squares);
    const userId = typeof currentUser === 'string' ? currentUser : currentUser.id;
    saveAction({ userId, data: squares }).catch(console.error);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      // Use the server action to save items
      const userId = typeof currentUser === 'string' ? currentUser : currentUser.id;
      const newItem = await saveUserItems(userId, JSON.stringify(selectedSquares()));
      setItems(prev => [newItem, ...prev.slice(0, 9)]); // Keep only last 10 items
      setSelectedSquares([]);
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  const toggleSquare = (i: number) => {
    const update = selectedSquares().includes(i) 
      ? selectedSquares().filter(j => j !== i)
      : [...selectedSquares(), i];
    updateSquares(update);
  };

  const handleRandomSelection = () => updateSquares(
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 49))
  );
  const handleClear = async () => {
    if (!currentUser) return;
    
    try {
      // Use the server action to delete all user items
      await deleteAction(currentUser);
      setItems([]);
      setSelectedSquares([]);
    } catch (error) {
      console.error('Error clearing items:', error);
    }
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
