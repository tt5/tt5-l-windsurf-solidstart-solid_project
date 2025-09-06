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
      console.log('useUserItems - No current user, clearing state');
      setItems([]);
      setSelectedSquares([]);
      return;
    }
    
    console.log('useUserItems - User changed, initializing with default selection');
    // Only set default selection if we don't have any squares yet
    if (selectedSquares().length === 0) {
      console.log('useUserItems - Setting default selection');
      setSelectedSquares([...DEFAULT_SELECTION]);
    }
  });

  const updateSquares = (squares: SelectedSquares) => {
    console.log('useUserItems - updateSquares called with:', squares);
    const prevSquares = selectedSquares();
    console.log('Previous squares:', prevSquares);
    
    // Only update if the squares have actually changed
    const hasChanged = squares.length !== prevSquares.length || 
      squares.some((sq, i) => sq !== prevSquares[i]);
      
    if (hasChanged) {
      console.log('Squares have changed, updating state');
      setSelectedSquares([...squares]);
      console.log('New squares state:', selectedSquares());
    } else {
      console.log('No changes in squares, skipping update');
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
