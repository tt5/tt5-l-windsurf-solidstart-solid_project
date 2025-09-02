import { APIEvent, json } from 'solid-start';
import { getUserItemRepository } from '~/lib/server/db';
import { getSession } from '@solid-mediakit/auth';

export async function GET({ params, request }: APIEvent) {
  const session = await getSession(request);
  if (!session) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const repo = getUserItemRepository();
    const item = await repo.findOne(Number(params.id));
    
    if (!item || item.user_id !== session.userId) {
      return json({ error: 'Item not found' }, { status: 404 });
    }
    
    return json({ item });
  } catch (error) {
    console.error('Error fetching item:', error);
    return json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT({ params, request }: APIEvent) {
  const session = await getSession(request);
  if (!session) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { data } = await request.json();
    if (!data) {
      return json({ error: 'Data is required' }, { status: 400 });
    }

    const repo = getUserItemRepository();
    const item = await repo.findOne(Number(params.id));
    
    if (!item || item.user_id !== session.userId) {
      return json({ error: 'Item not found' }, { status: 404 });
    }

    const updatedItem = await repo.update(Number(params.id), { data });
    return json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating item:', error);
    return json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE({ params, request }: APIEvent) {
  const session = await getSession(request);
  if (!session) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const repo = getUserItemRepository();
    const item = await repo.findOne(Number(params.id));
    
    if (!item || item.user_id !== session.userId) {
      return json({ error: 'Item not found' }, { status: 404 });
    }

    await repo.delete(Number(params.id));
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
