import { createSignal, createEffect } from 'solid-js';
import type { Item, SelectedSquares } from '../types/board';

const DEFAULT_SELECTION = [24]; // Center of 7x7 grid

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
    
    // For now, just set default selection
    setSelectedSquares([...DEFAULT_SELECTION]);
  });

  const updateSquares = (squares: SelectedSquares) => {
    setSelectedSquares(squares);
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
