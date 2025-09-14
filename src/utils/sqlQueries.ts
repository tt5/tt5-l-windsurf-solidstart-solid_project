import { getSlopeConditions } from './randomSlopes';

interface BasePoint {
  id: number;
  x: number;
  y: number;
}

export async function getPointsInLines(db: any, slopes: number[]): Promise<BasePoint[]> {
  // Get all points first to understand the current state
  const allPoints = await db.all('SELECT id, x, y FROM base_points ORDER BY id');
  console.log('\n=== All Points ===');
  console.table(allPoints);
  
  if (allPoints.length <= 1) {
    console.log('Not enough points to form lines');
    return [];
  }
  
  const pointsToDelete: BasePoint[] = [];
  
  try {
    // 1. Find vertical lines (same x-coordinate)
    console.log('\n=== Checking for Vertical Lines ===');
    const verticalLines = await db.all(`
      SELECT 
        x,
        GROUP_CONCAT(id) as point_ids,
        GROUP_CONCAT(y) as y_coords,
        COUNT(*) as point_count
      FROM base_points
      GROUP BY x
      HAVING point_count > 1
      ORDER BY point_count DESC
    `);
    
    console.log('\n=== Vertical Lines Found ===');
    console.table(verticalLines);
    
    // For each vertical line, keep the oldest point (smallest ID)
    for (const line of verticalLines) {
      const pointIds = line.point_ids.split(',').map(Number);
      const yCoords = line.y_coords.split(',').map(Number);
      
      // Find the oldest point (smallest ID)
      const oldestPointId = Math.min(...pointIds);
      
      // Add all other points to the delete list, except (0,0)
      for (let i = 0; i < pointIds.length; i++) {
        const currentPoint = { id: pointIds[i], x: line.x, y: yCoords[i] };
        // Skip if this is the oldest point or if it's (0,0)
        if (pointIds[i] !== oldestPointId && !(currentPoint.x === 0 && currentPoint.y === 0)) {
          pointsToDelete.push(currentPoint);
        }
      }
    }
    
    console.log('\n=== Points to Delete (Vertical Lines) ===');
    console.table(pointsToDelete);
    
    // Return points to delete for vertical lines
    return pointsToDelete;
    
  } catch (error) {
    console.error('Error in getPointsInLines:', error);
    return [];
  }
  
  // TODO: Implement horizontal and diagonal line detection
  // return pointsToDelete;
}

export async function deletePoints(db: any, points: BasePoint[]): Promise<void> {
  if (points.length === 0) return;
  
  await db.run(`
    DELETE FROM base_points
    WHERE id IN (${points.map(p => p.id).join(',')})
  `);
}
