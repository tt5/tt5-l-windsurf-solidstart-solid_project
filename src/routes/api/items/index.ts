import { APIEvent, json } from 'solid-start';
import { getUserItemRepository } from '~/lib/server/db';
import { getSession } from '@solid-mediakit/auth';

export async function GET({ request }: APIEvent) {
  const session = await getSession(request);
  if (!session) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const repo = getUserItemRepository();
    const items = await repo.findByUserId(session.userId);
    return json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST({ request }: APIEvent) {
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
    const newItem = await repo.create({
      user_id: session.userId,
      data
    });

    return json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return json({ error: 'Failed to create item' }, { status: 500 });
  }
}
