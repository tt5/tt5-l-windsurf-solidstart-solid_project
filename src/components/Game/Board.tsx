import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { query, createAsync, action, useAction } from '@solidjs/router';
import type { Item, SelectedSquares } from '../../types/board';
import { fetchUserItems, saveUserItems, clearUserItems } from '../../services/boardService';
import { moveSquares } from '../../utils/directionUtils';
import { useAuth } from '../../contexts/auth';
import Login from '../Auth/Login';
import styles from './Board.module.css';

type Direction = 'up' | 'down' | 'left' | 'right';

// Server actions - updated to use user-specific endpoints
const getItems = query(async (userId: string) => fetchUserItems(userId), 'userItems');
const refetchItems = action(({ userId, data }: { userId: string; data: SelectedSquares }) => 
  saveUserItems(userId, JSON.stringify(data)), 'refetchUserItems');
const deleteItems = action((userId: string) => clearUserItems(userId), 'deleteUserItems');

const Board: Component = () => {
  const { user, logout } = useAuth();
  const currentUser = user();
  
  // Initialize with empty array if no items exist
  const [items, setItems] = createSignal<Item[]>([]);
  
  // Load items when user changes
  createEffect(() => {
    if (!currentUser) {
      setItems([]);
      return;
    }
    
    // Use the server action to fetch user items
    getItems(currentUser)
      .then(data => setItems(data))
      .catch(error => console.error('Error loading user items:', error));
  });

  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  const saveAction = useAction(refetchItems);
  const deleteAction = useAction(deleteItems);

  const updateSquares = (squares: SelectedSquares) => {
    if (!currentUser) return;
    setSelectedSquares(squares);
    saveAction({ userId: currentUser, data: squares }).catch(console.error);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      // Use the server action to save items
      const newItem = await saveUserItems(currentUser, JSON.stringify(selectedSquares()));
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

  if (!user()) {
    return <Login />;
  }

  return (
    <div class={styles.board}>
      <div class={styles.userBar}>
        <span>Welcome, {user()}!</span>
        <button onClick={logout} class={styles.logoutButton}>
          Logout
        </button>
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
