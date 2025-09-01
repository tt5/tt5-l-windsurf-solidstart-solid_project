import { APIEvent } from "@solidjs/start/server";
import { getAllItems, addItem, deleteAllItems, type Item } from '~/lib/db';

// Type definition for creating new items
type NewItem = {
  data: string;
};

// GET /api/items
export async function GET({ params, request }: APIEvent) {
  try {
    const items = getAllItems();
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
    const data = await request.json();
    
    // Validate request body against schema
    if (!data.data) {
      return new Response(
        JSON.stringify({ 
          error: "Validation error",
          details: "The 'data' field is required"
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Add new item to database
    const result = addItem(data.data);
    
    // Return the newly created item with its ID
    return new Response(
      JSON.stringify({
        ...result,
        created_at: new Date().toISOString()
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
    const result = deleteAllItems();
    return new Response(
      JSON.stringify({
        message: 'All items deleted successfully',
        count: result.count,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
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
