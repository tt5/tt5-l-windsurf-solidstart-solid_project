import type { Item, ApiResponse, SelectedSquares } from '../types/board';

const API_BASE_URL = 'http://localhost:3000/api/items';

export const fetchItems = async (): Promise<Item[]> => {
  const response = await fetch(`${API_BASE_URL}?sort=-createdAt`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  const { items } = (await response.json()) as ApiResponse;
  return items;
};

export const saveItems = async (data: SelectedSquares | string): Promise<Item> => {
  // Ensure data is a string before sending
  const dataToSend = typeof data === 'string' ? data : JSON.stringify(data);
  
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: dataToSend }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save items');
  }
  
  return response.json();
};

export const deleteAllItems = async (): Promise<void> => {
  const response = await fetch(API_BASE_URL, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete items');
  }
};
