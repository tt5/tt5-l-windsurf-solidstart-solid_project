import type { Item, SelectedSquares } from '../types/board';
import { api } from '~/lib/api-client';

/**
 * Fetch items for the current user
 */
export const fetchUserItems = async (userId: string): Promise<Item[]> => {
  try {
    const response = await api.getItems(userId);
    return response.items || [];
  } catch (error) {
    console.error('Error fetching user items:', error);
    throw error;
  }
};

/**
 * Save items for the current user
 */
export const saveUserItems = async (userId: string, data: SelectedSquares | string): Promise<Item> => {
  try {
    // Ensure data is a string before saving
    const dataToSend = typeof data === 'string' ? data : JSON.stringify(data);
    const response = await api.addItem(userId, dataToSend);
    return response.item;
  } catch (error) {
    console.error('Error saving user items:', error);
    throw error;
  }
};

/**
 * Delete all items for the current user
 */
export const clearUserItems = async (userId: string): Promise<void> => {
  try {
    await api.clearItems(userId);
  } catch (error) {
    console.error('Error clearing user items:', error);
    throw error;
  }
};

/**
 * Save an item for the current user
 */
export const saveUserItem = async (userId: string, data: string): Promise<Item> => {
  try {
    const response = await api.addItem(userId, data);
    return response.item;
  } catch (error) {
    console.error('Error saving user item:', error);
    throw error;
  }
};
// All legacy functions have been removed. Use the following functions instead:
// - fetchUserItems(userId) instead of fetchItems()
// - saveUserItems(userId, data) instead of saveItems(data)
// - clearUserItems(userId) instead of deleteAllItems()