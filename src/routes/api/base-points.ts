import { APIEvent } from '@solidjs/start/server';
import { getBasePointRepository } from '~/lib/server/db';
import { withAuth } from '~/middleware/auth';
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

export const GET = withAuth(async () => {
  const requestId = generateRequestId();
  try {
    const repository = await getBasePointRepository();
    const basePoints = await repository.getAll();
    
    return createApiResponse(basePoints, { requestId });
  } catch (error) {
    return handleApiError(error, requestId, 'GET /api/base-points');
  }
});

export const POST = withAuth(async ({ request, user }) => {
  const requestId = generateRequestId();
  
  try {
    const data = await request.json() as BasePointRequest;
    validateCoordinates(data.x, data.y);
    
    const repository = await getBasePointRepository();
    const basePoint = await repository.add(
      user.userId,
      data.x,
      data.y
    );
    
    return createApiResponse(basePoint, { status: 201, requestId });
  } catch (error) {
    return handleApiError(error, requestId, 'POST /api/base-points');
  }
});

