import { Component, createSignal, createEffect, For } from 'solid-js';
import { query, createAsync, action, useAction } from '@solidjs/router';
import type { Item, SelectedSquares } from '../../types/board';
import { fetchItems, saveItems, deleteAllItems } from '../../services/boardService';
import { moveSquares } from '../../utils/directionUtils';
import Square from './Square';
import styles from './Board.module.css';

// Server actions
const getItems = query(async (): Promise<Item[]> => fetchItems(), 'items');
const refetchItems = action((data: SelectedSquares) => saveItems(JSON.stringify(data)), 'refetchItems');
const deleteItems = action(() => deleteAllItems(), 'deleteItems');

const Board: Component = () => {
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  const items = createAsync(() => getItems());
  const saveAction = useAction(refetchItems);
  const deleteAction = useAction(deleteItems);

  // Initialize from database
  createEffect(() => {
    const data = items();
    if (data?.[0]?.data) {
      const parsed = JSON.parse(data[0].data);
      setSelectedSquares(Array.isArray(parsed) ? parsed : []);
    }
  });

  const updateSquares = (newSquares: SelectedSquares) => {
    if (!Array.isArray(newSquares)) {
      console.error('Invalid squares data:', newSquares);
      return;
    }
    setSelectedSquares(newSquares);
    saveAction(newSquares).catch(err => {
      console.error('Save failed:', err);
      setSelectedSquares(selectedSquares());
    });
  };

  const handleSquareClick = (index: number) => {
    const squares = selectedSquares();
    updateSquares(squares.includes(index)
      ? squares.filter(i => i !== index)
      : [...squares, index]);
  };

  const handleRandomSelection = () => {
    updateSquares(Array.from({ length: 4 }, () => Math.floor(Math.random() * 49)));
  };

  const handleDeleteAll = () => {
    deleteAction().then(() => setSelectedSquares([]))
      .catch(err => console.error('Delete failed:', err));
  };

  // Direction handlers
  const handleDirection = async (direction: 'up' | 'down' | 'left' | 'right') => {
    const newSquares = await moveSquares(selectedSquares(), direction);
    updateSquares(newSquares);
  };

  const handleGoUp = () => handleDirection('up');
  const handleGoDown = () => handleDirection('down');
  const handleGoLeft = () => handleDirection('left');
  const handleGoRight = () => handleDirection('right');

  return (
    <div class={styles.board}>
      <div class={styles.history}>
        <h2>Selected Items History</h2>
        <ul class={styles.historyList}>
          <For each={items()}>
            {(item: Item) => (
              <li class={styles.historyItem}>
                {item.data}
              </li>
            )}
          </For>
        </ul>
        
        <div class={styles.controls}>
          <button
            class={styles.randomButton}
            onClick={handleRandomSelection}
          >
            Random Selection
          </button>
          <button
            class={styles.clearButton}
            onClick={handleDeleteAll}
          >
            clear all
          </button>
          <div class={styles.directionGroup}>
            <button
              class={styles.directionButton}
              onClick={handleGoUp}
            >
              ↑ Up
            </button>
            <div>
              <button
                class={styles.directionButton}
                onClick={handleGoLeft}
              >
                ← Left
              </button>
              <button
                class={styles.directionButton}
                onClick={handleGoRight}
              >
                Right →
              </button>
            </div>
            <button
              class={styles.directionButton}
              onClick={handleGoDown}
            >
              ↓ Down
            </button>
          </div>
        </div>
      </div>

      <div class={styles.grid}>
        {Array(49).fill(0).map((_, index) => (
          <div key={index}>
            <Square
              isSelected={selectedSquares().includes(index)}
              onClick={() => handleSquareClick(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
