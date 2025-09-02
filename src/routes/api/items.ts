import { APIEvent } from "@solidjs/start/server";
import { getUserItems, addUserItem, deleteAllUserItems, type Item } from '~/lib/db';

// Type definition for creating new items
type NewItem = {
  userId: string;
  data: string;
};

// GET /api/items
export async function GET({ params, request }: APIEvent) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const items = getUserItems(userId);
    return {
      items,
    };
  } catch (error) {
    console.error("Error fetching items:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch items",
        details: errorMessage
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// POST /api/items
export async function POST({ request, params }: APIEvent) {
  try {
    const { userId, data } = await request.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Save the new item for the user
    const newItem = addUserItem(userId, data);
    
    return new Response(
      JSON.stringify({
        id: newItem.id,
        user_id: userId,
        data,
        created_at: newItem.created_at
      }),
      { 
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error creating item:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: "Failed to create item",
        details: errorMessage 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// DELETE /api/items
export async function DELETE({ request, params }: APIEvent) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    deleteAllUserItems(userId);
    return new Response(null, { 
      status: 204,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting items:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: "Failed to delete items",
        details: errorMessage 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
