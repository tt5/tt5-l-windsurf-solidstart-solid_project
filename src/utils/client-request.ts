/**
 * Client-side API client for making HTTP requests to the server
 * 
 * This module provides a type-safe way to make HTTP requests from the client to the server.
 * It handles request/response formatting, error handling, and content-type headers.
 */

import type { ApiResponse } from './api';

/**
 * Makes an API request to the server
 * @template T - The expected response type
 * @param {string} endpoint - The API endpoint (without the '/api/' prefix)
 * @param {RequestInit} [options={}] - Fetch API options
 * @returns {Promise<T>} The parsed JSON response
 * @throws {Error} When the request fails or returns an error status
 */
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

/**
 * API client instance with typed methods for different endpoints
 * @namespace api
 */
export const api = {
  // Add typed API methods here as needed
  // Example:
  // getBoard: () => apiRequest<Board>('board')
};
