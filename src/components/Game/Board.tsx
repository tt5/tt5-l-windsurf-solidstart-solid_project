import { Component, createSignal, createEffect, For, createMemo } from 'solid-js';
import { query, createAsync, action, useAction } from '@solidjs/router';
import type { Item, SelectedSquares } from '../../types/board';
import { fetchItems, saveItems, deleteAllItems } from '../../services/boardService';
import Square from './Square';
import OutsideSquare from './OutsideSquare';
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

  const moveSquares = (condition: (i: number) => boolean, transform: (i: number) => number) => {
    updateSquares(selectedSquares().filter(condition).map(transform));
  };

  // Direction handlers using moveSquares
  const handleGoUp = () => moveSquares(i => i >= 7, i => i - 7);
  const handleGoDown = () => moveSquares(i => i < 42, i => i + 7);
  const handleGoLeft = () => moveSquares(i => i % 7 !== 0, i => i - 1);
  const handleGoRight = () => moveSquares(i => i % 7 !== 6, i => i + 1);

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
        {Array(49)
          .fill(0)
          .map((_, index) => {
            const row = Math.floor(index / 7);
            const col = index % 7;
            const isBorder = row === 0 || row === 6 || col === 0 || col === 6;
            
            return isBorder ? (
              <div key={index}>
                <OutsideSquare
                  isSelected={selectedSquares().includes(index)}
                  onClick={() => handleSquareClick(index)}
                />
              </div>
            ) : (
              <div key={index}>
                <Square
                  isSelected={selectedSquares().includes(index)}
                  onClick={() => handleSquareClick(index)}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Board;
