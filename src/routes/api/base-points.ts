import { APIEvent } from '@solidjs/start/server';
import { getBasePointRepository } from '~/lib/server/db';
import { getAuthUser } from '~/lib/server/auth/jwt';

type BasePointRequest = {
  x: number;
  y: number;
};

export async function GET({ request }: APIEvent) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const repository = getBasePointRepository();
    const basePoints = await repository.getByUser(user.userId);
    
    return new Response(JSON.stringify({ basePoints }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching base points:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch base points' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST({ request }: APIEvent) {
  console.log('[base-points] Received POST request');
  
  try {
    // Verify authentication
    const user = await getAuthUser(request);
    if (!user) {
      console.error('[base-points] Unauthorized: No user found in session');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Please log in' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log(`[base-points] Authenticated user: ${user.userId}`);

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
      console.log('[base-points] Request body:', JSON.stringify(body));
    } catch (e) {
      console.error('[base-points] Error parsing JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { x, y } = body as BasePointRequest;
    
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      console.error(`[base-points] Invalid coordinates: x=${x}, y=${y}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid coordinates',
          details: { x, y, types: { x: typeof x, y: typeof y } }
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[base-points] Adding base point for user ${user.userId} at (${x}, ${y})`);
    
    try {
      const repository = getBasePointRepository();
      const basePoint = await repository.add(user.userId, x, y);
      
      if (!basePoint) {
        throw new Error('Repository returned null/undefined base point');
      }
      
      console.log(`[base-points] Successfully added base point:`, basePoint);
      
      return new Response(JSON.stringify(basePoint), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (dbError) {
      console.error('[base-points] Database error:', dbError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
  } catch (error) {
    console.error('Error removing base point:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to remove base point' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
