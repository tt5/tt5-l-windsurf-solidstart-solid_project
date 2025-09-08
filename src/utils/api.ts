import { APIEvent } from '@solidjs/start/server';

type ApiResponseOptions = {
  status?: number;
  headers?: Record<string, string>;
  requestId?: string;
  duration?: number;
};

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp: number;
};

export function createApiResponse<T = any>(
  data: T,
  { status = 200, headers = {}, requestId, duration }: ApiResponseOptions = {}
) {
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    timestamp: Date.now(),
  };

  if (requestId) {
    response.requestId = requestId;
  }

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (requestId) {
    responseHeaders['X-Request-ID'] = requestId;
  }

  if (duration !== undefined) {
    responseHeaders['X-Process-Time'] = `${duration}ms`;
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: responseHeaders,
  });
}

export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any,
  options: Omit<ApiResponseOptions, 'status'> = {}
) {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: Date.now(),
  };

  if (details) {
    response.data = details;
  }
  
  if (options.requestId) {
    response.requestId = options.requestId;
  }

  return createApiResponse(response, { ...options, status });
}

export function generateRequestId() {
  return Math.random().toString(36).substring(2, 9);
}

// Helper type for API responses
export type { ApiResponse };
