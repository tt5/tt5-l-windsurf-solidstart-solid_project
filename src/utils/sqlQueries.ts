import { getRandomSlopes, getSlopeConditions } from './randomSlopes';
import { performance } from 'perf_hooks';

interface BasePoint {
  id: number;
  x: number;
  y: number;
  game_created_at_ms: number;
}

export async function getPointsInLines(db: any, slopes: number[] = []): Promise<{points: BasePoint[], duration: number}> {
  const startTime = performance.now();
  // Get all points first
  const allPoints = await db.all('SELECT game_created_at_ms as id, x, y FROM base_points ORDER BY game_created_at_ms');
  console.log(`[Cleanup] Checking ${allPoints.length} points`);
  
  if (allPoints.length <= 1) {
    console.log('[Cleanup] Not enough points to check for lines');
    return { points: [], duration: 0 };
  }
  
  const pointsToDelete: BasePoint[] = [];
  
  try {
    // Get slopes - either use provided ones or get random slopes
    let activeSlopes: number[] = [];
    
    if (slopes.length > 0) {
      // If slopes are provided, ensure we include all variants (original, reciprocal, negatives)
      const slopeVariants = new Set<number>();
      const addVariants = (s: number) => {
        slopeVariants.add(s);
        if (s !== 0) {
          slopeVariants.add(1/s);
        }
        slopeVariants.add(-s);
        if (s !== 0) {
          slopeVariants.add(-1/s);
        }
      };
      
      slopes.forEach(slope => addVariants(slope));
      activeSlopes = Array.from(slopeVariants);
    } else {
      // If no slopes provided, get 2 random ones
      activeSlopes = getRandomSlopes(2);
    }
    
    const slopeConditions = getSlopeConditions(activeSlopes);
  
    // Group slopes by their base value
    const slopeGroups = new Map<number, number[]>();
    activeSlopes.forEach(slope => {
      const base = Math.round(Math.abs(slope) * 100) / 100;
      if (!slopeGroups.has(base)) {
        slopeGroups.set(base, []);
      }
      slopeGroups.get(base)!.push(slope);
    });
  
    // 1. Find vertical lines (same x-coordinate)
    const verticalLines = await db.all(`
      WITH points_with_ts AS (
        SELECT 
          id,
          x,
          y,
          game_created_at_ms,
          ROW_NUMBER() OVER (PARTITION BY x ORDER BY game_created_at_ms) as rn
        FROM base_points
        WHERE (x, y) != (0, 0)  -- Exclude (0,0) from cleanup
      )
      SELECT 
        x,
        GROUP_CONCAT(id) as point_ids,
        GROUP_CONCAT(y) as y_coords,
        GROUP_CONCAT(game_created_at_ms) as timestamps,
        COUNT(*) as point_count
      FROM points_with_ts
      GROUP BY x
      HAVING point_count > 1
      ORDER BY point_count DESC
    `);
    
    // For each vertical line, keep the oldest point (smallest game_created_at_ms)
    for (const line of verticalLines) {
      const pointIds = line.point_ids.split(',').map(Number);
      const yCoords = line.y_coords.split(',').map(Number);
      const timestamps = line.timestamps.split(',').map(Number);
      
      // Create points with their timestamps
      const points = pointIds.map((id: number, index: number): BasePoint => ({
        id,
        x: line.x,
        y: yCoords[index],
        game_created_at_ms: timestamps[index]
      }));
      
      // Find the oldest point (smallest game_created_at_ms)
      const oldestPoint = points.reduce((oldest: BasePoint, current: BasePoint) => 
        current.game_created_at_ms < oldest.game_created_at_ms ? current : oldest
      );
      
      // Add all other points to the delete list, except (0,0)
      for (const point of points) {
        // Skip if this is the oldest point or if it's (0,0)
        if (point.id !== oldestPoint.id && !(point.x === 0 && point.y === 0)) {
          // Only add if not already in delete list
          if (!pointsToDelete.some(p => p.id === point.id)) {
            pointsToDelete.push(point);
          }
        }
      }
    }
    
    // Points to delete are now in pointsToDelete array
    
    // 2. Find horizontal lines (same y-coordinate)
    const horizontalLines = await db.all(`
      SELECT 
        y,
        GROUP_CONCAT(id) as point_ids,
        GROUP_CONCAT(x) as x_coords,
        COUNT(*) as point_count
      FROM base_points
      WHERE (x, y) != (0, 0)  -- Exclude (0,0) from cleanup
      GROUP BY y
      HAVING point_count > 1
      ORDER BY point_count DESC
    `);
    
    // For each horizontal line, keep the oldest point (smallest game_created_at_ms)
    for (const line of horizontalLines) {
      const pointIds = line.point_ids.split(',').map(Number);
      const xCoords = line.x_coords.split(',').map(Number);
      const timestamps = line.timestamps.split(',').map(Number);
      
      // Create points with their timestamps
      const points = pointIds.map((id: number, index: number): BasePoint => ({
        id,
        x: xCoords[index],
        y: line.y,
        game_created_at_ms: timestamps[index]
      }));
      
      // Find the oldest point (smallest game_created_at_ms)
      const oldestPoint = points.reduce((oldest: BasePoint, current: BasePoint) => 
        current.game_created_at_ms < oldest.game_created_at_ms ? current : oldest
      );
      
      // Add all other points to the delete list, except (0,0)
      for (const point of points) {
        // Skip if this is the oldest point or if it's (0,0)
        if (point.id !== oldestPoint.id && !(point.x === 0 && point.y === 0)) {
          // Only add if not already in delete list
          if (!pointsToDelete.some(p => p.id === point.id)) {
            pointsToDelete.push(point);
          }
        }
      }
    }
    
    // 3. Find lines with specific slopes - process in batches to avoid SQLite expression tree limits
    const BATCH_SIZE = 5; // Process 5 slopes at a time
    const diagonalLines = [];
    
    // Process slopes in batches
    for (let i = 0; i < activeSlopes.length; i += BATCH_SIZE) {
      const batchSlopes = activeSlopes.slice(i, i + BATCH_SIZE);
      const batchSlopeConditions = getSlopeConditions(batchSlopes);
      
      console.log(`[Cleanup] Processing slopes batch ${i/BATCH_SIZE + 1}/${Math.ceil(activeSlopes.length/BATCH_SIZE)}`);
      
      try {
        const batchResults = await db.all(`
          SELECT 
            p1.id as p1_id, p1.x as p1_x, p1.y as p1_y, p1.game_created_at_ms as p1_created_at,
            p2.id as p2_id, p2.x as p2_x, p2.y as p2_y, p2.game_created_at_ms as p2_created_at
          FROM base_points p1
          JOIN base_points p2 ON p1.id < p2.id
          WHERE ${batchSlopeConditions}
            AND NOT (p1.x = 0 AND p1.y = 0)  -- Exclude (0,0) from cleanup
            AND NOT (p2.x = 0 AND p2.y = 0)  -- Exclude (0,0) from cleanup
        `);
        
        diagonalLines.push(...batchResults);
      } catch (error) {
        console.error(`[Cleanup] Error processing slopes batch ${i/BATCH_SIZE + 1}:`, error);
        // Continue with next batch even if one fails
      }
    }
    
    // Process diagonal lines
    const diagonalGroups = new Map<string, BasePoint[]>();
    
    for (const line of diagonalLines) {
      // Calculate line equation: a*x + b*y + c = 0
      const a = line.p2_y - line.p1_y;
      const b = line.p1_x - line.p2_x;
      const c = line.p2_x * line.p1_y - line.p1_x * line.p2_y;
      
      // Create a unique line identifier
      const lineId = `${a}_${b}_${c}`;
      
      if (!diagonalGroups.has(lineId)) {
        diagonalGroups.set(lineId, []);
      }
      
      // Add both points to the line group if not already present
      const p1 = { 
        id: line.p1_id, 
        x: line.p1_x, 
        y: line.p1_y, 
        game_created_at_ms: line.p1_created_at 
      };
      const p2 = { 
        id: line.p2_id, 
        x: line.p2_x, 
        y: line.p2_y, 
        game_created_at_ms: line.p2_created_at 
      };
      
      if (!diagonalGroups.get(lineId)!.some(p => p.id === p1.id)) {
        diagonalGroups.get(lineId)!.push(p1);
      }
      if (!diagonalGroups.get(lineId)!.some(p => p.id === p2.id)) {
        diagonalGroups.get(lineId)!.push(p2);
      }
    }
    
    // For each diagonal line, keep the oldest point
    for (const [_, points] of diagonalGroups.entries()) {
      if (points.length < 2) continue;
      
      // Find oldest point (smallest game_created_at_ms)
      const oldestPoint = points.reduce((oldest: BasePoint, current: BasePoint) => 
        current.game_created_at_ms < oldest.game_created_at_ms ? current : oldest
      );
      
      // Add other points to delete list
      for (const point of points) {
        if (point.id !== oldestPoint.id) {
          // Only add if not already in delete list
          if (!pointsToDelete.some(p => p.id === point.id)) {
            pointsToDelete.push(point);
          }
        }
      }
    }
    
    const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`[Cleanup] Found ${pointsToDelete.length} points to remove`);
  return { points: pointsToDelete, duration };
    
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error('[Cleanup] Error in getPointsInLines:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });
    return { points: [], duration };
  }
  
  // All line detections are now implemented above
}

export async function deletePoints(db: any, points: BasePoint[]): Promise<void> {
  if (!points.length) return;
  
  const placeholders = points.map(() => '(?)').join(',');
  const ids = points.map(p => p.id);
  
  await db.run(`
    DELETE FROM base_points 
    WHERE id IN (${placeholders})
  `, ids);
}
