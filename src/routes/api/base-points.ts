import { APIEvent } from '@solidjs/start/server';
import { getBasePointRepository } from '~/lib/server/db';
import { getAuthUser } from '~/lib/server/auth/jwt';
import { createApiResponse, createErrorResponse, generateRequestId } from '~/utils/api';

type BasePointRequest = { x: number; y: number };

const validateCoordinates = (x: number, y: number) => {
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    throw new Error('Invalid coordinates provided');
  }
  if (x < 0 || x >= 7 || y < 0 || y >= 7) {
    throw new Error('Coordinates out of bounds. Must be between 0 and 6');
  }
};

const withAuth = async (request: Request, requestId: string) => {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

const handleApiError = (error: unknown, requestId: string, endpoint: string) => {
  if (error instanceof Error) {
    if (error.message === 'Invalid coordinates provided' || error.message.includes('out of bounds')) {
      return createErrorResponse('Invalid request', 400, error.message, { requestId });
    }
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Authentication required', 401, undefined, { requestId });
    }
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${requestId}] Error in ${endpoint}:`, error);
  return createErrorResponse(
    `Failed to process request`,
    500,
    process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    { requestId }
  );
};

export async function GET({ request }: APIEvent) {
  const requestId = generateRequestId();
  try {
    const user = await withAuth(request, requestId);
    const repository = await getBasePointRepository();
    const basePoints = await repository.getByUser(user.userId);
    
    return createApiResponse(
      { success: true, data: { basePoints } },
      { requestId, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  } catch (error) {
    return handleApiError(error, requestId, 'GET /api/base-points');
  }
}

export async function POST({ request }: APIEvent) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    const user = await withAuth(request, requestId);
    const data = await request.json() as BasePointRequest;
    validateCoordinates(data.x, data.y);
    
    const repository = await getBasePointRepository();
    const basePoint = await repository.add(user.userId, data.x, data.y);
    
    return createApiResponse(
      { success: true, data: { basePoint } },
      { status: 201, requestId, duration: Date.now() - startTime }
    );
  } catch (error) {
    return handleApiError(error, requestId, 'POST /api/base-points');
  }
}

export async function DELETE({ request }: APIEvent) {
  const requestId = generateRequestId();
  
  try {
    const user = await withAuth(request, requestId);
    const { x, y } = await request.json() as BasePointRequest;
    validateCoordinates(x, y);
    
    const repository = await getBasePointRepository();
    const success = await repository.remove(user.userId, x, y);
    
    if (!success) {
      return createErrorResponse('Base point not found', 404, undefined, { requestId });
    }
    
    return createApiResponse(
      { success: true },
      { status: 204, requestId }
    );
  } catch (error) {
    return handleApiError(error, requestId, 'DELETE /api/base-points');
  }
}
