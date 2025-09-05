import { APIEvent } from '@solidjs/start/server';
import { getBasePointRepository } from '~/lib/server/db';
import { getAuthUser } from '~/lib/server/auth/jwt';

type BasePointRequest = {
  x: number;
  y: number;
};

export async function GET({ request }: APIEvent) {
  console.log(`[${new Date().toISOString()}] GET /api/base-points`);
  
  try {
    // Verify authentication
    const user = await getAuthUser(request);
    if (!user) {
      console.warn('Unauthorized access attempt to /api/base-points');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authentication required' 
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching base points for user: ${user.userId}`);
    const repository = await getBasePointRepository();
    const basePoints = await repository.getByUser(user.userId);
    
    console.log(`Found ${basePoints.length} base points for user ${user.userId}`);
    return new Response(
      JSON.stringify({ 
        success: true,
        data: { basePoints } 
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in GET /api/base-points:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch base points',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function POST({ request }: APIEvent) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 9);
  
  console.log(`[${new Date().toISOString()}] [${requestId}] POST /api/base-points`);
  
  try {
    // Verify authentication
    console.log(`[${requestId}] Verifying authentication`);
    const user = await getAuthUser(request);
    if (!user) {
      const error = 'Authentication required';
      console.warn(`[${requestId}] Unauthorized: ${error}`);
      return new Response(
        JSON.stringify({ 
          requestId,
          success: false,
          error: 'Unauthorized: Please log in',
          details: error
        }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log(`[base-points] Authenticated user: ${user.userId}`);

    // Parse and validate request body
    let data: BasePointRequest;
    try {
      const body = await request.json();
      console.log('[base-points] Request body:', JSON.stringify(body));
      
      data = body as BasePointRequest;
      
      if (typeof data.x !== 'number' || typeof data.y !== 'number' || isNaN(data.x) || isNaN(data.y)) {
        throw new Error('Invalid coordinates provided');
      }
      
      if (data.x < 0 || data.x >= 7 || data.y < 0 || data.y >= 7) {
        throw new Error('Coordinates out of bounds. Must be between 0 and 6');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid request body';
      console.error(`[${requestId}] Bad Request: ${errorMessage}`, { error });
      return new Response(
        JSON.stringify({ 
          requestId,
          success: false,
          error: 'Invalid request',
          details: errorMessage
        }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${requestId}] Adding base point at (${data.x}, ${data.y}) for user ${user.userId}`);
    
    try {
      const repository = await getBasePointRepository();
      const basePoint = await repository.create({
        x: data.x,
        y: data.y,
        userId: user.userId
      });

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Successfully added base point in ${duration}ms`, { 
        basePointId: basePoint.id,
        duration
      });
      
      return new Response(
        JSON.stringify({ 
          requestId,
          success: true,
          data: { basePoint }
        }), 
        { 
          status: 201, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Process-Time': `${duration}ms`
          } 
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${requestId}] Error creating base point:`, error);
      
      return new Response(
        JSON.stringify({ 
          requestId,
          success: false,
          error: 'Failed to add base point',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'X-Request-ID': requestId
          } 
        }
      );
    }  
  } catch (error) {
    console.error('[base-points] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE({ request }: APIEvent) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { x, y } = await request.json() as BasePointRequest;
    
    if (typeof x !== 'number' || typeof y !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const repository = getBasePointRepository();
    const success = await repository.remove(user.userId, x, y);
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Base point not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(null, { status: 204 });
  } catch (dbError) {
    const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
    const errorStack = dbError instanceof Error ? dbError.stack : undefined;
    
    console.error('[base-points] Database error:', {
      message: errorMessage,
      stack: errorStack,
      error: JSON.stringify(dbError, Object.getOwnPropertyNames(dbError))
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to remove base point',
        details: errorMessage
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
