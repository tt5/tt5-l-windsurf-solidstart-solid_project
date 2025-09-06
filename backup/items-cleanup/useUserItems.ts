import { createSignal, createEffect } from 'solid-js';
import type { Item } from '../types/board';

export type SelectedSquares = number[]; // Array of flat indices

const DEFAULT_SELECTION = [24]; // Center of 7x7 grid (3,3)

interface UseUserItemsOptions {
  onClear?: () => void;
}

export const useUserItems = (currentUser: any, options: UseUserItemsOptions = {}) => {
  const [items, setItems] = createSignal<Item[]>([]);
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  
  // Load items when user changes
  createEffect(() => {
    if (!currentUser) {
      setItems([]);
      setSelectedSquares([]);
      return;
    }
    
    // Only set default selection if we don't have any squares yet
    if (selectedSquares().length === 0) {
      setSelectedSquares([...DEFAULT_SELECTION]);
    }
  });

  const updateSquares = (squares: SelectedSquares) => {
    const prevSquares = selectedSquares();
    
    // Only update if the squares have actually changed
    const hasChanged = squares.length !== prevSquares.length || 
      squares.some((sq, i) => sq !== prevSquares[i]);
      
    if (hasChanged) {
      setSelectedSquares([...squares]);
    }
  };

  const handleSave = async () => {
    console.log('Saving items:', selectedSquares());
  };

  const handleClear = () => {
    setItems([]);
    setSelectedSquares([]);
    options.onClear?.();
  };

  return {
    items,
    selectedSquares,
    updateSquares,
    handleSave,
    handleClear,
  };
};
