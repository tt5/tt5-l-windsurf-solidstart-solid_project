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
    const basePoint = await repository.add(user.userId, x, y);
    
    return new Response(JSON.stringify(basePoint), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding base point:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to add base point' }), 
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
