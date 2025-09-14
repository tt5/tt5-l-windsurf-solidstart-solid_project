import { MapTile } from '~/lib/server/repositories/map-tile.repository';
import { MapTileRepository } from '~/lib/server/repositories/map-tile.repository';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class TileCacheService {
  private cache: Map<string, CacheEntry<MapTile>>;
  private maxSize: number;
  private defaultTTL: number; // in milliseconds
  private tileRepository: MapTileRepository;
  
  /**
   * Get a tile from cache or generate it if not found
   */
  async getOrGenerate(tileX: number, tileY: number, generator: (x: number, y: number) => Promise<MapTile>): Promise<MapTile> {
    // Try to get from cache first
    const cached = this.get(tileX, tileY);
    if (cached) {
      return cached;
    }
    
    // If not in cache, try to get from database
    const dbTile = await this.tileRepository.getTile(tileX, tileY);
    if (dbTile) {
      // Cache the tile for future use
      this.set(dbTile);
      return dbTile;
    }
    
    // If not in database, generate it
    const tile = await generator(tileX, tileY);
    // Save to database and cache
    await this.tileRepository.saveTile(tile);
    this.set(tile);
    return tile;
  }

  constructor(tileRepository: MapTileRepository, maxSize = 1000, defaultTTL = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.tileRepository = tileRepository;
  }

  /**
   * Generate a cache key from tile coordinates
   */
  private getCacheKey(tileX: number, tileY: number): string {
    return `${tileX},${tileY}`;
  }

  /**
   * Get a tile from cache
   */
  get(tileX: number, tileY: number): MapTile | null {
    const key = this.getCacheKey(tileX, tileY);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Store a tile in cache
   */
  set(tile: MapTile, ttl: number = this.defaultTTL): void {
    if (!tile || tile.tileX == null || tile.tileY == null || !tile.data) {
      throw new Error('Invalid tile data');
    }
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const key = this.getCacheKey(tile.tileX, tile.tileY);
    this.cache.set(key, {
      data: { ...tile }, // Create a shallow copy
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Invalidate a specific tile in cache
   */
  invalidate(tileX: number, tileY: number): void {
    const key = this.getCacheKey(tileX, tileY);
    this.cache.delete(key);
  }

  /**
   * Clear all cached tiles
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL
    };
  }
}

// Export a singleton instance
export const tileCacheService = new TileCacheService();
