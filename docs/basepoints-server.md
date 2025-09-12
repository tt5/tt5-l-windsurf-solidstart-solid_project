# Base Points Database Operations

## Database Schema

```sql
CREATE TABLE base_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  x INTEGER NOT NULL,  -- Integer coordinate (-1000 to 1000)
  y INTEGER NOT NULL,  -- Integer coordinate (-1000 to 1000)
  created_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),  -- When the server runs: stored in milliseconds since Unix epoch (1970-01-01 00:00:00.000 UTC)
  updated_at_ms INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),  -- Currently unused
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, x, y)
);
```

## Core Operations

### Adding a Base Point
1. **Process**:
   - Start transaction
   - Verify user exists
   - Check for duplicate coordinates
   - Insert new record

2. **Validation**:
   - Coordinates must be integers between -1000 and 1000
   - User must exist and be authenticated
   - No duplicate coordinates per user

3. **SQL**:
   ```sql
   -- Note: updated_at_ms is not used in the application
   INSERT INTO base_points (user_id, x, y, created_at_ms, updated_at_ms)
   VALUES (?, ?, ?, ?, ?)
   ```

### Development-Only: Removing Base Points
1. **Availability**:
   - Only in development mode
   - Accessible through DevTools
   - Disabled in production

2. **Implementation**:
   ```typescript
   // Removes all base points for a user
   async deleteAllBasePointsForUser(userId: string): Promise<void> {
     await this.db.run('DELETE FROM base_points WHERE user_id = ?', [userId]);
   }
   ```

## Performance

### Indexes
- `idx_base_points_user_id`: Speeds up user-specific queries
- `idx_base_points_coords`: Optimizes spatial lookups

### Transactions
- All writes are transactional
- Minimal lock duration
- Automatic rollback on failure

## Error Cases
1. **Duplicate Coordinates**  
   - Returns existing base point
   - Prevents duplicate entries

2. **Invalid User**  
   - User doesn't exist
   - Returns 400 Bad Request

3. **Out of Bounds**  
   - Coordinates outside -1000 to 1000 range
   - Returns 400 Bad Request

## Related Database Components

- **Repository**: `src/lib/server/repositories/base-point.repository.ts`
- **Migrations**: `migrations/0001_initial_schema.ts`
