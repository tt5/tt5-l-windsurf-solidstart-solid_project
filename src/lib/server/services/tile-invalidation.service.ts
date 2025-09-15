import { tileCacheService } from './tile-cache.service';
import { basePointEventService } from '~/lib/server/events/base-point-events';
import { getAffectedTiles } from '~/lib/server/utils/coordinate-utils';

/**
 * Service to handle tile invalidation when base points change
 */
export class TileInvalidationService {
  private static instance: TileInvalidationService;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): TileInvalidationService {
    if (!TileInvalidationService.instance) {
      TileInvalidationService.instance = new TileInvalidationService();
    }
    return TileInvalidationService.instance;
  }

  /**
   * Initialize the service and set up event listeners
   */
  public initialize(): void {
    if (this.isInitialized) return;

    // Listen to base point events
    basePointEventService.on('created', (point) => this.handleBasePointChange(point));
    basePointEventService.on('updated', (point) => this.handleBasePointChange(point));
    basePointEventService.on('deleted', (point) => this.handleBasePointChange(point));

    this.isInitialized = true;
  }

  /**
   * Handle base point changes by invalidating affected tiles
   */
  private handleBasePointChange(point: { x: number; y: number }): void {
    try {
      // Get all tiles affected by this base point
      const affectedTiles = getAffectedTiles(point.x, point.y);
      
      // Invalidate each affected tile in the cache
      for (const { tileX, tileY } of affectedTiles) {
        tileCacheService.invalidate(tileX, tileY);
      }

    } catch (error) {
      console.error('Error handling base point change:', error);
    }
  }

  /**
   * Manually invalidate tiles for a specific area
   */
  public invalidateArea(x1: number, y1: number, x2: number, y2: number): void {
    // Get all tiles in the area
    const startTile = this.worldToTileCoords(x1, y1);
    const endTile = this.worldToTileCoords(x2, y2);
    
    // Invalidate each tile in the area
    for (let y = Math.min(startTile.tileY, endTile.tileY); y <= Math.max(startTile.tileY, endTile.tileY); y++) {
      for (let x = Math.min(startTile.tileX, endTile.tileX); x <= Math.max(startTile.tileX, endTile.tileX); x++) {
        tileCacheService.invalidate(x, y);
      }
    }
  }
  
  private worldToTileCoords(x: number, y: number): { tileX: number; tileY: number } {
    return {
      tileX: Math.floor(x / 64),
      tileY: Math.floor(y / 64)
    };
  }
}

// Export a singleton instance
const tileInvalidationService = TileInvalidationService.getInstance();

export { tileInvalidationService };

// Initialize the service when this module is imported
tileInvalidationService.initialize();
