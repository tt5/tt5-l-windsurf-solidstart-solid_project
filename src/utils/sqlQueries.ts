import { getSlopeConditions } from './randomSlopes';

interface BasePoint {
  id: number;
  x: number;
  y: number;
}

export async function getPointsInLines(db: any, slopes: number[]): Promise<BasePoint[]> {
  const slopeConditions = getSlopeConditions(slopes);
  
  return db.all(`
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
        -- OR matching one of the random slopes
        OR (${slopeConditions})
      )
      -- Keep the oldest point (lowest id)
      AND p2.id < p1.id
    )
    -- Always keep [0,0]
    AND NOT (p1.x = 0 AND p1.y = 0);
  `);
}

export async function deletePoints(db: any, points: BasePoint[]): Promise<void> {
  if (points.length === 0) return;
  
  await db.run(`
    DELETE FROM base_points
    WHERE id IN (${points.map(p => p.id).join(',')})
  `);
}
