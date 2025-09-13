# Base Point Map Server

## Overview
The map server provides a simple grid-based visualization of all base point locations in the game world, showing only whether coordinates are occupied or not.

## Database Schema

### Base Points
```sql
-- Reuses the existing base_points table
-- See basepoints-server.md for schema details
```

### Map Tiles
```sql
CREATE TABLE IF NOT EXISTS map_tiles (
  tile_x INTEGER NOT NULL,  -- Tile X coordinate
  tile_y INTEGER NOT NULL,  -- Tile Y coordinate
  data BLOB NOT NULL,      -- Bitmap data (1 bit per coordinate)
  version INTEGER NOT NULL DEFAULT 1,
  last_updated_ms INTEGER NOT NULL,
  PRIMARY KEY (tile_x, tile_y)
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_map_tiles_coords ON map_tiles(tile_x, tile_y);
```

## API Endpoints

### 1. Get Map Tile
```http
GET /api/map/tile/{tileX}/{tileY}
```
**Response:**
```typescript
{
  tileX: number;
  tileY: number;
  version: number;
  data: string;  // Base64-encoded bitmap (1 bit per coordinate)
  points: Array<[number, number]>;  // Array of [x, y] coordinates with base points
}
```

## Implementation Details

### Tile System
- **Size**: 64x64 coordinates per tile
- **Data**: 1 bit per coordinate (0 = empty, 1 = has base point)
- **Updates**: Tiles are updated when client loads map the first time and no data is in the database and when client misses the client cache.

### Data Flow
1. Client requests visible tiles based on (0,0) world coordinate and map viewport
2. Server returns tile data with point coordinates
3. Client renders occupied coordinates on a grid

## Performance
- **Efficient Storage**: Bitmap compression (1 bit per coordinate)
- **Caching**: Tiles are cached for 30 s