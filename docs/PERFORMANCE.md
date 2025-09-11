# Performance Analysis and Solutions

## Problem Statement

The `calculate-squares` endpoint was experiencing performance issues when handling many base points. The main issues were:

1. **High Database Load**: Loading all base points for every request
2. **O(n²) Complexity**: Processing all base points against all border indices
3. **Memory Pressure**: Storing all base points in memory

## Solution 1: Random Subset Selection

### Overview
Instead of loading all base points, we fetch a random subset of points for each request.

### Implementation
```typescript
// In base-point.repository.ts
async getRandomSample(sampleSize: number = 100): Promise<BasePoint[]> {
  return this.db.all<BasePoint[]>(
    `SELECT id, user_id as userId, x, y, created_at_ms as createdAtMs 
     FROM base_points 
     ORDER BY RANDOM() 
     LIMIT ?`,
    [sampleSize]
  ) || [];
}
```

### Advantages
- Simple to implement
- Predictable performance
- Even distribution of base points

### Limitations
- May miss important base points in some cases
- Not optimal for all game scenarios

## Solution 2: Spatial Indexing

### Overview
Use database indexing to efficiently query only relevant base points based on their position.

### Implementation
```sql
-- Create spatial indexes
CREATE INDEX idx_base_points_xy ON base_points(x, y);
CREATE INDEX idx_base_points_user ON base_points(user_id);
CREATE INDEX idx_base_points_user_xy ON base_points(user_id, x, y);

-- Query with spatial filtering
SELECT * FROM base_points 
WHERE x BETWEEN ? - 20 AND ? + 20
AND y BETWEEN ? - 20 AND ? + 20
ORDER BY (x-?)*(x-?) + (y-?)*(y-?) ASC
LIMIT ?
```

### Advantages
- More accurate results
- Better performance for clustered base points
- Scales well with large numbers of points

### Limitations
- More complex implementation
- Requires database schema changes
- Slightly higher maintenance overhead

## Recommendation

### For Small to Medium Games
- Use **Random Subset Selection** for its simplicity and good enough performance
- Sample size can be adjusted based on performance testing

### For Large-Scale Games
- Implement **Spatial Indexing** for optimal performance
- Consider combining with client-side prediction
- Add caching for frequently accessed regions

## Monitoring and Tuning
1. Monitor query performance
2. Adjust sample size or radius based on real-world usage
3. Consider implementing a hybrid approach if needed
