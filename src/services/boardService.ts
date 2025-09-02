import type { Item, ApiResponse, SelectedSquares } from '../types/board';
import { getUserItems, addUserItem, deleteAllUserItems } from '~/lib/db';

const API_BASE_URL = '/api/items';

/**
 * Fetch items for the current user
 */
export const fetchUserItems = async (userId: string): Promise<Item[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }
    const { items } = (await response.json()) as ApiResponse;
    return items;
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
    // Ensure data is a string before sending
    const dataToSend = typeof data === 'string' ? data : JSON.stringify(data);
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        data: dataToSend 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to save items');
    }
    
    return response.json();
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
    const response = await fetch(API_BASE_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to clear items');
    }
  } catch (error) {
    console.error('Error clearing user items:', error);
    throw error;
  }
};

// Keep the old functions for backward compatibility
export const fetchItems = async (): Promise<Item[]> => {
  console.warn('fetchItems() is deprecated. Use fetchUserItems(userId) instead.');
  return [];
};

export const saveItems = async (data: SelectedSquares | string): Promise<Item> => {
  console.warn('saveItems() is deprecated. Use saveUserItems(userId, data) instead.');
  return { id: 0, user_id: '', data: '', created_at: new Date().toISOString() };
};

export const deleteAllItems = async (): Promise<void> => {
  console.warn('deleteAllItems() is deprecated. Use clearUserItems(userId) instead.');
};