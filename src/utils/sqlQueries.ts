import { getSlopeConditions } from './randomSlopes';

interface BasePoint {
  id: number;
  x: number;
  y: number;
}

export async function getPointsInLines(db: any, slopes: number[]): Promise<BasePoint[]> {
  const slopeConditions = getSlopeConditions(slopes);
  
  // Get all points first to understand the current state
  const allPoints = await db.all('SELECT id, x, y FROM base_points ORDER BY id');
  console.log('Current points in database:', allPoints);
  
  if (allPoints.length <= 1) {
    console.log('Not enough points to form lines');
    return [];
  }
  
  // Find all pairs of points that form lines with the given slopes
  const linePoints = await db.all(`
    WITH RECURSIVE
    -- Generate all possible point pairs
    PointPairs AS (
      SELECT 
        p1.id as p1_id,
        p1.x as p1_x,
        p1.y as p1_y,
        p2.id as p2_id,
        p2.x as p2_x,
        p2.y as p2_y
      FROM base_points p1
      JOIN base_points p2 ON p1.id < p2.id  -- Ensure we don't get duplicate pairs
      WHERE 
        -- Same x (vertical line)
        (p2.x = p1.x) OR
        -- Same y (horizontal line)
        (p2.y = p1.y) OR
        -- Matching one of the random slopes
        (${slopeConditions})
    ),
    -- For each line, find all points on that line
    LinesWithPoints AS (
      SELECT 
        pp.p1_id,
        pp.p1_x,
        pp.p1_y,
        pp.p2_id,
        pp.p2_x,
        pp.p2_y,
        -- Calculate line equation: a*x + b*y + c = 0
        (pp.p2_y - pp.p1_y) as a,
        (pp.p1_x - pp.p2_x) as b,
        (pp.p2_x * pp.p1_y - pp.p1_x * pp.p2_y) as c,
        -- Create a unique line identifier using the line equation coefficients
        -- For vertical lines: 'v_x'
        -- For horizontal lines: 'h_y'
        -- For diagonal lines: 'd_slope_intercept' (rounded to 2 decimal places)
        CASE 
          WHEN pp.p2_x = pp.p1_x THEN 'v_' || pp.p1_x  -- Vertical line
          WHEN pp.p2_y = pp.p1_y THEN 'h_' || pp.p1_y  -- Horizontal line
          ELSE 'd_' || 
               ROUND((pp.p2_y - pp.p1_y) * 100.0 / (pp.p2_x - pp.p1_x)) / 100.0 || '_' ||
               ROUND((pp.p1_y * (pp.p2_x - pp.p1_x) - (pp.p2_y - pp.p1_y) * pp.p1_x) * 100.0 / (pp.p2_x - pp.p1_x)) / 100.0
        END as line_id
      FROM PointPairs pp
    ),
    -- Find all points that are on each line
    PointsOnLines AS (
      SELECT 
        p.id as point_id,
        p.x,
        p.y,
        lw.line_id,
        lw.p1_id as line_p1,
        lw.p2_id as line_p2
      FROM base_points p
      JOIN LinesWithPoints lw ON 
        -- Check if point is on the line (using line equation with small epsilon for floating point)
        ABS(lw.a * p.x + lw.b * p.y + lw.c) < 0.000001
      WHERE NOT (p.x = 0 AND p.y = 0)  -- Never consider (0,0) for deletion
    ),
    -- For each line, get all points and the oldest point
    LinePoints AS (
      SELECT 
        line_id,
        point_id,
        x,
        y,
        MIN(point_id) OVER (PARTITION BY line_id) as oldest_point_id,
        COUNT(*) OVER (PARTITION BY line_id) as point_count
      FROM PointsOnLines
    )
    -- Select points that are not the oldest in their line and have at least one other point
    SELECT DISTINCT
      point_id as id,
      x,
      y
    FROM LinePoints
    WHERE point_id != oldest_point_id  -- Don't delete the oldest point
    AND point_count > 1  -- Only consider lines with at least 2 points
    ORDER BY point_id
  `);
  
  console.log('Points to delete:', linePoints.map((p: BasePoint) => `(${p.x},${p.y})[${p.id}]`).join(', '));
  
  // Return the points to delete
  return linePoints.map((row: BasePoint) => ({
    id: row.id,
    x: row.x,
    y: row.y
  }));
}

export async function deletePoints(db: any, points: BasePoint[]): Promise<void> {
  if (points.length === 0) return;
  
  await db.run(`
    DELETE FROM base_points
    WHERE id IN (${points.map(p => p.id).join(',')})
  `);
}
