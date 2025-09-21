# Tile Cache Management

## Core Requirements

### Memory Management
- [ ] Implement LRU (Least Recently Used) eviction policy
- [ ] Set `MAX_TILES` limit (default: 100)
- [ ] Track tile access timestamps

### Viewport Awareness
- [ ] Track viewport position in MapView
- [ ] Add buffer zone (1 screen by default)
- [ ] Debounce viewport updates (100ms)

## Implementation

### TileCache Interface
```typescript
interface TileCacheOptions {
  maxTiles?: number;         // Max tiles in memory (default: 100)
  viewportBuffer?: number;   // Screens to keep (default: 1)
  cleanupInterval?: number;  // Cleanup interval in ms (default: 10s)
  batchSize?: number;        // Tiles per batch (default: 10)
  batchDelay?: number;       // Delay between batches (default: 50ms)
}

class TileCache {
  private maxTiles: number;
  private viewportBuffer: number;
  private cleanupInterval: number;
  private batchSize: number;
  private batchDelay: number;
  
  private viewport: Viewport | null = null;
  private lastCleanupTime = 0;
  private cleanupInProgress = false;
  private tileAccessTimes = new Map<string, number>();
  
  constructor(options: TileCacheOptions = {}) {
    this.maxTiles = options.maxTiles || 100;
    this.viewportBuffer = options.viewportBuffer || 1;
    this.cleanupInterval = options.cleanupInterval || 10000;
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 50;
  }
  
  updateViewport(viewport: Viewport) {
    this.viewport = viewport;
    this.scheduleCleanup();
  }
  
  private async cleanupTiles() {
    if (this.cleanupInProgress) return;
    this.cleanupInProgress = true;
    
    try {
      const now = Date.now();
      if (now - this.lastCleanupTime < this.cleanupInterval) return;
      
      this.lastCleanupTime = now;
      const tiles = await this.getAllTiles();
      const viewportTiles = this.viewport 
        ? this.getTilesInViewport(tiles, this.viewport, this.viewportBuffer)
        : new Set();
      
      // Sort tiles by priority (furthest from viewport and oldest first)
      const sortedTiles = tiles
        .filter(tile => !viewportTiles.has(tile.id))
        .sort((a, b) => {
          const aDist = this.viewport ? this.distanceFromViewport(a, this.viewport) : 0;
          const bDist = this.viewport ? this.distanceFromViewport(b, this.viewport) : 0;
          return bDist - aDist || 
                 (this.tileAccessTimes.get(b.id) || 0) - (this.tileAccessTimes.get(a.id) || 0);
        });
      
      // Remove excess tiles in batches
      const excessTiles = sortedTiles.slice(this.maxTiles);
      await this.removeTilesInBatches(excessTiles);
      
    } finally {
      this.cleanupInProgress = false;
    }
  }
}
```

### Viewport Utilities
```typescript
interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

function isInViewport(tile: Tile, viewport: Viewport, buffer = 1): boolean {
  const tileSize = 256 * (1 / viewport.zoom);
  const bufferX = viewport.width * buffer;
  const bufferY = viewport.height * buffer;
  
  return (
    tile.x * tileSize < viewport.x + viewport.width + bufferX &&
    (tile.x + 1) * tileSize > viewport.x - bufferX &&
    tile.y * tileSize < viewport.y + viewport.height + bufferY &&
    (tile.y + 1) * tileSize > viewport.y - bufferY
  );
}
```

## Testing Plan

1. **Unit Tests**
   - Test viewport calculations
   - Test LRU eviction logic
   - Test batch processing
   - Test memory pressure handling

2. **Integration Tests**
   - Test with real viewport changes
   - Test memory usage under load
   - Test cleanup during pan/zoom

3. **Performance Testing**
   - Profile memory usage
   - Measure cleanup operation duration
   - Test with large numbers of tiles

## Rollout Strategy

1. **Initial Release**
   - Enable with feature flag
   - Monitor memory usage
   - Collect performance metrics

2. **Gradual Rollout**
   - Enable for 10% of users
   - Monitor error rates
   - Check performance impact

3. **Full Rollout**
   - Enable for all users
   - Continue monitoring
   - Gather user feedback

## Monitoring and Alerts

1. **Key Metrics**
   - Memory usage
   - Cleanup duration
   - Tile cache hit ratio
   - Frame rate during cleanup

2. **Alerting**
   - Memory usage spikes
   - Cleanup timeouts
   - Cache hit ratio drops
   - Frame rate drops

## Future Improvements

1. **Advanced Caching**
   - Disk-based caching for offscreen tiles
   - Prefetching based on movement direction
   - Adaptive quality based on network conditions

2. **Performance**
   - Web Worker for cleanup operations
   - Request scheduling based on frame budget
   - Progressive loading of high-detail areas

3. **User Experience**
   - Smooth transitions between quality levels
   - Loading indicators for offscreen tiles
   - User-configurable quality settings
