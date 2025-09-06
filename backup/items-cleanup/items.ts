import { APIEvent } from "@solidjs/start/server";
import { 
  getUserItems, 
  addUserItem, 
  deleteAllUserItems, 
  deleteUserItem, 
  type Item 
} from '~/lib/server/db';

type NewItem = {
  userId: string;
  data: string;
};

type ErrorResponse = {
  error: string;
  details?: any;
};

// GET /api/items
export async function GET({ request }: APIEvent) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return jsonResponse({ error: 'User ID is required' }, 400);
    }

    const items = await getUserItems(userId);
    return jsonResponse({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return jsonResponse({ error: 'Failed to fetch items' }, 500);
  }
}

// POST /api/items
export async function POST({ request }: APIEvent) {
  try {
    const { userId, data } = await request.json() as NewItem;
    
    if (!userId || !data) {
      return jsonResponse({ error: 'User ID and data are required' }, 400);
    }

    const item = await addUserItem(userId, data);
    return jsonResponse({ item }, 201);
  } catch (error) {
    console.error('Error adding item:', error);
    return jsonResponse({ error: 'Failed to add item' }, 500);
  }
}

// DELETE /api/items
export async function DELETE({ request }: APIEvent) {
  try {
    const { userId } = await request.json() as { userId: string };
    
    if (!userId) {
      return jsonResponse({ error: 'User ID is required' }, 400);
    }

    await deleteAllUserItems(userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error clearing items:', error);
    return jsonResponse({ error: 'Failed to clear items' }, 500);
  }
}

// DELETE /api/items/[id]
export async function DELETE_ITEM({ params, request }: APIEvent) {
  try {
    const itemId = params?.id;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId || !itemId) {
      return jsonResponse({ 
        error: 'User ID and Item ID are required' 
      }, 400);
    }

    const success = await deleteUserItem(userId, parseInt(itemId, 10));
    if (!success) {
      return jsonResponse({ error: 'Item not found' }, 404);
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting item:', error);
    return jsonResponse({ error: 'Failed to delete item' }, 500);
  }
}

// Helper function for JSON responses
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
