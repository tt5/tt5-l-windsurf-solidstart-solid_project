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

  const handleSquareClick = (index: number) => {
    const squares = selectedSquares();
    updateSquares(squares.includes(index) 
      ? squares.filter(i => i !== index) 
      : [...squares, index]);
  };

  const handleRandomSelection = () => 
    updateSquares(Array.from({ length: 4 }, () => Math.floor(Math.random() * 49)));

  const handleDeleteAll = () => 
    deleteAction().then(() => setSelectedSquares([])).catch(console.error);

  const handleDirection = (direction: Direction) => 
    moveSquares(selectedSquares(), direction).then(updateSquares).catch(console.error);
    
  const directionHandlers = {
    up: () => handleDirection('up'),
    down: () => handleDirection('down'),
    left: () => handleDirection('left'),
    right: () => handleDirection('right')
  };

  const directions = [
    { id: 'up', label: '↑ Up', dir: 'up' },
    { 
      id: 'middle', 
      buttons: [
        { id: 'left', label: '← Left', dir: 'left' },
        { id: 'right', label: 'Right →', dir: 'right' }
      ]
    },
    { id: 'down', label: '↓ Down', dir: 'down' }
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
              {({ id, label, dir, buttons }) => (
                <Show when={buttons} fallback={
                  <button class={styles.directionButton} onClick={() => handleDirection(dir as Direction)}>
                    {label}
                  </button>
                }>
                  <div>
                    <For each={buttons}>
                      {({ id, label, dir }) => (
                        <button 
                          class={styles.directionButton} 
                          onClick={() => handleDirection(dir as Direction)}
                        >
                          {label}
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              )}
            </For>
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        <For each={Array(49).fill(0)}>{
          (_, i) => (
            <div 
              onClick={() => handleSquareClick(i())}
              class={styles.square}
              classList={{ [styles.selected]: selectedSquares().includes(i()) }}
              role="button"
              aria-pressed={selectedSquares().includes(i())}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill={selectedSquares().includes(i()) ? '#FFD700' : 'transparent'}
                  stroke="#333"
                  stroke-width="2"
                />
              </svg>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default Board;
