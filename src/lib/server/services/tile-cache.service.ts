import { MapTile } from '~/lib/server/repositories/map-tile.repository';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class TileCacheService {
  private cache: Map<string, CacheEntry<MapTile>>;
  private maxSize: number;
  private defaultTTL: number; // in milliseconds

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
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
  set(tile: MapTile, ttl?: number): void {
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
