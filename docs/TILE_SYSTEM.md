# Tile System Architecture

## Overview
The tile system is responsible for efficiently serving map data to clients. It uses a two-level caching strategy to balance performance and data freshness.

## Tile Generation
- Each tile covers a 64x64 world coordinate area
- Tiles are generated on-demand when first requested
- Generated tiles are stored in both the database and server cache

## Caching Strategy

### 1. Server-Side Cache (First Level)
- **TTL**: 10 seconds
- **Purpose**: Reduce database load and generation cost
- **Location**: In-memory cache (`tileCacheService`)
- **Invalidation**:
  - Automatic expiration after TTL
  - Manual invalidation when base points change
  - Server restart clears the cache

### 2. Client-Side Cache (Second Level)
- **TTL**: 30 seconds
- **Purpose**: Reduce server requests
- **Location**: Browser's IndexedDB
- **Invalidation**:
  - Automatic expiration after TTL
  - Manual refresh by user
  - Version mismatch with server

## Cache Flow

1. **Cache Hit (Client)**
   ```
   Client: Tile in cache and fresh (<30s old)
   → Use cached tile
   ```

2. **Cache Miss (Client) → Cache Hit (Server)**
   ```
   Client: Tile missing or stale (>30s)
   → Request from server
   → Server: Tile in cache and fresh (<10s)
   → Return cached tile
   → Client updates cache
   ```

3. **Cache Miss (Both)**
   ```
   Client: Tile missing or stale (>30s)
   → Request from server
   → Server: Tile missing or stale (>10s)
   → Generate new tile
   → Update server cache
   → Return new tile
   → Client updates cache
   ```

## Performance Characteristics
- **First Request**: Full generation cost (slowest)
- **Subsequent Requests (within 10s)**: Served from server cache (fastest)
- **After 10s**: Served from database (fast)
- **After 30s**: Client requests fresh data

## Monitoring
- Check `fromCache` flag in API responses
- Monitor server logs for cache hit/miss metrics
- Track tile generation times

## Troubleshooting
- **Stale Data**: Check cache TTLs and invalidation logic
- **High Load**: Verify cache hit rates and consider adjusting TTLs
- **Memory Usage**: Monitor server memory with large numbers of unique tiles

## Future Improvements
- Implement cache warming for frequently accessed tiles
- Add distributed caching for horizontal scaling
- Add metrics for cache performance monitoring
- Consider progressive tile loading for better perceived performance
