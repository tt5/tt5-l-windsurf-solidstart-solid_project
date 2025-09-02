import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { query, createAsync, action, useAction } from '@solidjs/router';
import type { Item, SelectedSquares } from '../../types/board';
import { fetchItems, saveItems, deleteAllItems } from '../../services/boardService';
import { moveSquares } from '../../utils/directionUtils';
import styles from './Board.module.css';

type Direction = 'up' | 'down' | 'left' | 'right';

// Server actions
const getItems = query(async (): Promise<Item[]> => fetchItems(), 'items');
const refetchItems = action((data: SelectedSquares) => saveItems(JSON.stringify(data)), 'refetchItems');
const deleteItems = action(deleteAllItems, 'deleteItems');

const Board: Component = () => {
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  const items = createAsync(getItems);
  const saveAction = useAction(refetchItems);
  const deleteAction = useAction(deleteItems);

  // Initialize from database
  createEffect(() => {
    const data = items();
    const parsed = data?.[0]?.data ? JSON.parse(data[0].data) : [];
    setSelectedSquares(Array.isArray(parsed) ? parsed : []);
  });

  const updateSquares = (newSquares: SelectedSquares) => {
    if (!Array.isArray(newSquares)) return console.error('Invalid squares data:', newSquares);
    setSelectedSquares(newSquares);
    saveAction(newSquares).catch(console.error);
  };

  const toggleSquare = (i: number) => {
    const squares = selectedSquares();
    updateSquares(squares.includes(i) ? squares.filter(j => j !== i) : [...squares, i]);
  };

  const handleRandomSelection = () => 
    updateSquares(Array.from({ length: 4 }, () => Math.floor(Math.random() * 49)));

  const handleDeleteAll = () => 
    deleteAction().then(() => setSelectedSquares([])).catch(console.error);

  const handleDirection = (direction: Direction) => 
    moveSquares(selectedSquares(), direction).then(updateSquares).catch(console.error);
    
  const directions = [
    ['up', '↑ Up'],
    ['left', '← Left'],
    ['right', 'Right →'],
    ['down', '↓ Down']
  ] as const;

  return (
    <div class={styles.board}>
      <div class={styles.history}>
        <h2>Selected Items History</h2>
        <ul class={styles.historyList}>
          <For each={items()}>{
            (item: Item) => <li class={styles.historyItem}>{item.data}</li>
          }</For>
        </ul>
        
        <div class={styles.controls}>
          <button class={styles.randomButton} onClick={handleRandomSelection}>
            Random Selection
          </button>
          <button class={styles.clearButton} onClick={handleDeleteAll}>
            Clear All
          </button>
          <div class={styles.directionGroup}>
            <For each={directions}>
              {([dir, label]) => (
                <button 
                  class={styles.directionButton}
                  onClick={() => handleDirection(dir as Direction)}
                  children={label}
                />
              )}
            </For>
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        {Array.from({ length: 49 }, (_, i) => {
          const isSelected = selectedSquares().includes(i);
          return (
            <div 
              onClick={() => toggleSquare(i)}
              class={`${styles.square} ${isSelected ? styles.selected : ''}`}
              role="button"
              aria-pressed={isSelected}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill={isSelected ? '#FFD700' : 'transparent'}
                  stroke="#333"
                  stroke-width="2"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Board;
