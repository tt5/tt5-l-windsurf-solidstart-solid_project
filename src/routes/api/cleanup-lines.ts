import { getDb } from '~/lib/server/db';
import { withAuth } from '~/middleware/auth';
import { createErrorResponse } from '~/utils/api';

export const POST = withAuth(async ({ user }) => {
  // Check if user is admin
  if (user.role !== 'admin'&& process.env.NODE_ENV !== 'development) {
    return createErrorResponse('Forbidden', 403, 'Admin access required');
  }
  
  try {
    const db = await getDb();
    
    // First, identify points to delete
    const pointsToDelete = await db.all(`
      SELECT p1.id, p1.x, p1.y
      FROM base_points p1
      WHERE EXISTS (
        SELECT 1 FROM base_points p2
        WHERE p2.id != p1.id
        AND (
          -- Same x (vertical line)
          p2.x = p1.x
          -- OR same y (horizontal line)
          OR p2.y = p1.y
          -- OR same diagonal (x-y)
          OR (p2.x - p2.y) = (p1.x - p1.y)
          -- OR same anti-diagonal (x+y)
          OR (p2.x + p2.y) = (p1.x + p1.y)
          -- Slope 2:1 (dx * 2 = dy)
          OR (p2.x - p1.x) * 2 = (p2.y - p1.y)
          -- Slope 1:2 (dx = dy * 2)
          OR (p2.x - p1.x) = (p2.y - p1.y) * 2
          -- Slope 3:1 (dx * 3 = dy)
          OR (p2.x - p1.x) * 3 = (p2.y - p1.y)
          -- Slope 1:3 (dx = dy * 3)
          OR (p2.x - p1.x) = (p2.y - p1.y) * 3
        )
        -- Keep the oldest point (lowest id)
        AND p2.id < p1.id
      )
      -- Always keep [0,0]
      AND NOT (p1.x = 0 AND p1.y = 0);
    `);
    
    // Delete the identified points
    if (pointsToDelete.length > 0) {
      await db.run(`
        DELETE FROM base_points
        WHERE id IN (${pointsToDelete.map(p => p.id).join(',')})
      `);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Line cleanup completed',
      deletedCount: pointsToDelete.length,
      deletedPoints: pointsToDelete
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in line cleanup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return createErrorResponse('Internal Server Error', 500, errorMessage);
  }
});