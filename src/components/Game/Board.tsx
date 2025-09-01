import { Component, createSignal, createEffect, For, createMemo } from 'solid-js';
import { query, createAsync, action, useAction } from '@solidjs/router';
import type { Item, SelectedSquares } from '../../types/board';
import { fetchItems, saveItems, deleteAllItems } from '../../services/boardService';
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

  const moveSquares = (condition: (i: number) => boolean, transform: (i: number) => number) => {
    updateSquares(selectedSquares().filter(condition).map(transform));
  };

  // Direction handlers with random border selection
  const handleGoUp = async () => {
    try {
      const currentSquares = selectedSquares();
      const bottomRowIndices = [42, 43, 44, 45, 46, 47, 48];
      
      // Move existing squares up and filter out any that would move off the grid
      const movedSquares = currentSquares
        .filter(i => i >= 7) // Can't move up if already on top row
        .map(i => i - 7);
      
      // Get 2-4 random squares from the bottom row
      let randomCount = 2; // Default value
      try {
        const response = await fetch(`/api/random?count=1&max=2`);
        if (!response.ok) {
          throw new Error('Failed to fetch random numbers');
        }
        const data = await response.json();
        randomCount = (data.numbers?.[0] ?? 0) + 2; // 2-4 random squares
      } catch (error) {
        console.error('Error fetching random numbers, using default count:', error);
        // Fallback to a random number between 2-4 if API fails
        randomCount = 2 + Math.floor(Math.random() * 3);
      }
      
      // Get random indices from bottom row
      const randomBorderSquares = [];
      const availableIndices = [...bottomRowIndices];
      
      for (let i = 0; i < randomCount && availableIndices.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        randomBorderSquares.push(availableIndices.splice(randomIndex, 1)[0]);
      }
      
      // Combine moved squares with random border squares, removing duplicates
      const newSelection = [...new Set([...movedSquares, ...randomBorderSquares])];
      updateSquares(newSelection);
    } catch (error) {
      console.error('Error in handleGoUp:', error);
    }
  };

  const handleGoDown = async () => {
    try {
      const currentSquares = selectedSquares();
      const topRowIndices = [0, 1, 2, 3, 4, 5, 6];
      
      // Move existing squares down and filter out any that would move off the grid
      const movedSquares = currentSquares
        .filter(i => i < 42) // Can't move down if already on bottom row
        .map(i => i + 7);
      
      // Get 2-4 random squares from the top row
      let randomCount = 2; // Default value
      try {
        const response = await fetch(`/api/random?count=1&max=2`);
        if (!response.ok) {
          throw new Error('Failed to fetch random numbers');
        }
        const data = await response.json();
        randomCount = (data.numbers?.[0] ?? 0) + 2; // 2-4 random squares
      } catch (error) {
        console.error('Error fetching random numbers, using default count:', error);
        // Fallback to a random number between 2-4 if API fails
        randomCount = 2 + Math.floor(Math.random() * 3);
      }
      
      // Get random indices from top row
      const randomBorderSquares = [];
      const availableIndices = [...topRowIndices];
      
      for (let i = 0; i < randomCount && availableIndices.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        randomBorderSquares.push(availableIndices.splice(randomIndex, 1)[0]);
      }
      
      // Combine moved squares with random border squares, removing duplicates
      const newSelection = [...new Set([...movedSquares, ...randomBorderSquares])];
      updateSquares(newSelection);
    } catch (error) {
      console.error('Error in handleGoDown:', error);
    }
  };
  const handleGoLeft = async () => {
    try {
      const currentSquares = selectedSquares();
      const rightBorderIndices = [6, 13, 20, 27, 34, 41, 48];
      
      // Move existing squares left and filter out any that would move off the grid
      const movedSquares = currentSquares
        .filter(i => i % 7 !== 0) // Can't move left if already on left edge
        .map(i => i - 1);
      
      // Get 2-4 random squares from the right border
      let randomCount = 2; // Default value
      try {
        const response = await fetch(`/api/random?count=1&max=2`);
        if (!response.ok) {
          throw new Error('Failed to fetch random numbers');
        }
        const data = await response.json();
        randomCount = (data.numbers?.[0] ?? 0) + 2; // 2-4 random squares
      } catch (error) {
        console.error('Error fetching random numbers, using default count:', error);
        // Fallback to a random number between 2-4 if API fails
        randomCount = 2 + Math.floor(Math.random() * 3);
      }
      
      // Get random indices from right border
      const randomBorderSquares = [];
      const availableIndices = [...rightBorderIndices];
      
      for (let i = 0; i < randomCount && availableIndices.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        randomBorderSquares.push(availableIndices.splice(randomIndex, 1)[0]);
      }
      
      // Combine moved squares with random border squares, removing duplicates
      const newSelection = [...new Set([...movedSquares, ...randomBorderSquares])];
      
      // Update all at once
      updateSquares(newSelection);
    } catch (error) {
      console.error('Error in handleGoLeft:', error);
    }
  };
  const handleGoRight = async () => {
    try {
      const currentSquares = selectedSquares();
      const leftBorderIndices = [0, 7, 14, 21, 28, 35, 42];
      
      // Move existing squares right and filter out any that would move off the grid
      const movedSquares = currentSquares
        .filter(i => i % 7 !== 6) // Can't move right if already on right edge
        .map(i => i + 1);
      
      // Get 2-4 random squares from the left border
      let randomCount = 2; // Default value
      try {
        const response = await fetch(`/api/random?count=1&max=2`);
        if (!response.ok) {
          throw new Error('Failed to fetch random numbers');
        }
        const data = await response.json();
        randomCount = (data.numbers?.[0] ?? 0) + 2; // 2-4 random squares
      } catch (error) {
        console.error('Error fetching random numbers, using default count:', error);
        // Fallback to a random number between 2-4 if API fails
        randomCount = 2 + Math.floor(Math.random() * 3);
      }
      
      // Get random indices from left border
      const randomBorderSquares = [];
      const availableIndices = [...leftBorderIndices];
      
      for (let i = 0; i < randomCount && availableIndices.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        randomBorderSquares.push(availableIndices.splice(randomIndex, 1)[0]);
      }
      
      // Combine moved squares with random border squares, removing duplicates
      const newSelection = [...new Set([...movedSquares, ...randomBorderSquares])];
      updateSquares(newSelection);
    } catch (error) {
      console.error('Error in handleGoRight:', error);
    }
  };

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
