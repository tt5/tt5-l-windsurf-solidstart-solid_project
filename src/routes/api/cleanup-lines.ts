import { getDb } from '~/lib/server/db';
import { withAuth } from '~/middleware/auth';
import { createErrorResponse } from '~/utils/api';
import { getRandomSlopes } from '~/utils/randomSlopes';
import { getPointsInLines, deletePoints } from '~/utils/sqlQueries';

export const POST = withAuth(async ({ user }) => {
  // Check if user is admin
  if (user.role !== 'admin' && process.env.NODE_ENV !== 'development') {
    return createErrorResponse('Forbidden', 403, 'Admin access required');
  }
  
  try {
    const db = await getDb();
    
    // Get random slopes (2-4 random primes, including 1 for basic diagonals)
    const slopes = getRandomSlopes(2 + Math.floor(Math.random() * 3));
    
    // Get and delete points in lines
    const pointsToDelete = await getPointsInLines(db, slopes);
    
    if (pointsToDelete.length > 0) {
      await deletePoints(db, pointsToDelete);
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Line cleanup completed',
      deletedCount: pointsToDelete.length,
      deletedPoints: pointsToDelete,
      slopesUsed: slopes // Include used slopes in response for debugging
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