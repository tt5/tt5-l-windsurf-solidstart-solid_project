import { APIEvent } from '@solidjs/start/server';

type ApiResponseOptions = {
  status?: number;
  headers?: Record<string, string>;
  requestId?: string;
  duration?: number;
};

export function createApiResponse(
  data: any,
  { status = 200, headers = {}, requestId, duration }: ApiResponseOptions = {}
) {
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

  return new Response(JSON.stringify(data), {
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
  const response: any = { success: false, error };
  if (details) response.details = details;
  if (options.requestId) response.requestId = options.requestId;
  
  return createApiResponse(response, { ...options, status });
}

export function generateRequestId() {
  return Math.random().toString(36).substring(2, 9);
}
