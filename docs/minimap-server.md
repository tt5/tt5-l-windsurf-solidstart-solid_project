# Minimap Server

## Database Schema
```sql
-- Add to existing schema
CREATE TABLE IF NOT EXISTS minimap_tiles (
  x INTEGER NOT NULL,  -- Tile X coordinate
  y INTEGER NOT NULL,  -- Tile Y coordinate
  tile_data BLOB NOT NULL,  -- Compressed PNG data
  last_updated_ms INTEGER NOT NULL,  -- Last update timestamp
  PRIMARY KEY (x, y)
);
```

## API Endpoint

### Get Minimap Data
```http
GET /api/minimap/region?minX={minX}&minY={minY}&maxX={maxX}&maxY={maxY}
```

**Response:**
```typescript
{
  points: Array<{
    x: number;
    y: number;
    type: 'player' | 'resource';
    ownerId?: string;
  }>;
}
```

## Implementation

1. **Tile Generation**
   - 256x256 pixel tiles
   - Zoom levels 0-3
   - Generate on demand, cache in memory

2. **Data Updates**
   - Update tiles when base points change
   - Invalidate cache for affected regions

3. **Security**
   - Rate limit: 100 requests/minute per IP
   - Validate all coordinate inputs
