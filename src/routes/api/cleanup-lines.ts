import type { APIEvent } from "@solidjs/start/server";
import { getDb } from '~/lib/server/db';

export async function POST({ request }: APIEvent) {
    try {
      const db = await getDb();
      
      // First, identify points to delete
      const pointsToDelete = await db.all(`
        SELECT p1.id, p1.x, p1.y
        FROM base_points p1
        WHERE p1.id NOT IN (
          -- For vertical lines (same x)
          SELECT MIN(id) FROM base_points GROUP BY x
          
          UNION
          
          -- For horizontal lines (same y)
          SELECT MIN(id) FROM base_points GROUP BY y
          
          UNION
          
          -- For diagonal lines (x-y is the same)
          SELECT MIN(id) FROM base_points GROUP BY (x - y)
        )
        AND NOT (p1.x = 0 AND p1.y = 0)
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
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }