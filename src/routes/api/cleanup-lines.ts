import type { APIEvent } from "@solidjs/start/server";
import { getDb } from '~/lib/server/db';

export async function POST({ request }: APIEvent) {
    try {
      const db = await getDb();
      
      // First, identify points to delete
      const pointsToDelete = await db.all(`
        SELECT p1.id, p1.x, p1.y
        FROM base_points p1
        WHERE EXISTS (
          -- Find other points that form a line with p1
          SELECT 1 FROM base_points p2
          WHERE p2.id != p1.id
          AND (
            -- Same x (vertical line)
            p2.x = p1.x
            -- OR same y (horizontal line)
            OR p2.y = p1.y
            -- OR same diagonal (x-y)
            OR (p2.x - p2.y) = (p1.x - p1.y)
          )
          -- Keep the oldest point (lowest id)
          AND p2.id < p1.id
        )
        -- Always keep [0,0]
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