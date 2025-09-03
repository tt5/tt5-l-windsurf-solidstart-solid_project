import { createSignal, createEffect, createMemo } from 'solid-js';
import { query, action, useAction } from '@solidjs/router';
import type { Item, SelectedSquares } from '../types/board';
import { fetchUserItems, saveUserItems, clearUserItems } from '../services/boardService';
import { getUserId } from '../utils/userUtils';

const DEFAULT_SELECTION = [24]; // Center of 7x7 grid

export const useUserItems = (currentUser: any) => {
  const [items, setItems] = createSignal<Item[]>([]);
  const [selectedSquares, setSelectedSquares] = createSignal<SelectedSquares>([]);
  
  // Server actions
  const getItems = query(async (user) => {
    const userId = getUserId(user);
    if (!userId) throw new Error('User not authenticated');
    return fetchUserItems(userId);
  }, 'userItems');

  const refetchItems = action(async ({ userId, data }: { userId: any; data: SelectedSquares }) => {
    const id = getUserId(userId);
    if (!id) throw new Error('User not authenticated');
    return saveUserItems(id, JSON.stringify(data));
  }, 'refetchUserItems');

  const deleteItems = action(async (userId: any) => {
    const id = getUserId(userId);
    if (!id) throw new Error('User not authenticated');
    return clearUserItems(id);
  }, 'deleteUserItems');

  const saveAction = useAction(refetchItems);
  const deleteAction = useAction(deleteItems);

  // Load items when user changes
  createEffect(() => {
    if (!currentUser) {
      setItems([]);
      setSelectedSquares([]);
      return;
    }
    
    const userId = getUserId(currentUser);
    getItems(userId)
      .then(data => {
        setItems(data);
        if (data.length > 0) {
          try {
            const lastItem = data[0];
            const squares = JSON.parse(lastItem.data);
            setSelectedSquares(Array.isArray(squares) && squares.length > 0 ? squares : [...DEFAULT_SELECTION]);
          } catch {
            setSelectedSquares([]);
          }
        } else {
          setSelectedSquares([]);
        }
      })
      .catch(() => setSelectedSquares([]));
  });

  const updateSquares = (squares: SelectedSquares) => {
    if (!currentUser) return;
    setSelectedSquares(squares);
    saveAction({ userId: currentUser, data: squares }).catch(console.error);
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      const newItem = await saveUserItems(getUserId(currentUser)!, JSON.stringify(selectedSquares()));
      setItems(prev => [newItem, ...prev.slice(0, 9)]);
      setSelectedSquares([]);
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  const handleClear = async () => {
    if (!currentUser) return;
    try {
      await deleteAction(currentUser);
      setItems([]);
      setSelectedSquares([]);
    } catch (error) {
      console.error('Error clearing items:', error);
    }
  };

  return {
    items,
    selectedSquares,
    updateSquares,
    handleSave,
    handleClear,
  };
};
