import { createSignal, createEffect } from 'solid-js';

export type SelectedSquares = number[]; // Array of flat indices

interface UseUserItemsOptions {
  onClear?: () => void;
}

export const useUserItems = (currentUser: any, options: UseUserItemsOptions = {}) => {
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  
  // Set default selection when user is available
  createEffect(() => {
    if (currentUser && selectedSquares().length === 0) {
      setSelectedSquares([24]); // Center of 7x7 grid (3,3)
    } else if (!currentUser) {
      setSelectedSquares([]);
    }
  });

  const updateSquares = (squares: SelectedSquares) => {
    setSelectedSquares([...squares]);
  };

  const handleClear = () => {
    setSelectedSquares([]);
    options.onClear?.();
  };

  return {
    selectedSquares,
    updateSquares,
    handleClear,
  };
};
