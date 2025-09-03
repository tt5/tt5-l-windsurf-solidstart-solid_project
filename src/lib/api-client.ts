// Client-side API client that communicates with server endpoints

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Request failed');
  }

  return response.json();
}

export const api = {
  async getItems(userId: string) {
    return apiRequest<{ items: any[] }>(`items?userId=${encodeURIComponent(userId)}`);
  },
  
  async addItem(userId: string, data: any) {
    return apiRequest<{ item: any }>('items', {
      method: 'POST',
      body: JSON.stringify({ userId, data }),
    });
  },
  
  async deleteItem(userId: string, itemId: string) {
    return apiRequest(`items/${itemId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },
  
  async clearItems(userId: string) {
    const response = await fetch('/api/items', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to clear items');
    }

    // If the response has content, parse it as JSON, otherwise return empty object
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }
};
