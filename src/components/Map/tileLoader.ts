import { TileCache } from '../../lib/client/services/tile-cache';
import { createSignal, Accessor } from 'solid-js';

export interface Tile {
  x: number;
  y: number;
  data: Uint8Array | null;
  loading: boolean;
  error: boolean;
  timestamp: number;
  mountId: number;
  fromCache?: boolean;
}

interface LoadTileOptions {
  forceRefresh?: boolean;
  isMounted: Accessor<boolean>;
  currentMountId: number;
  viewport: () => { x: number; y: number };
  onTileLoaded: (tile: Tile) => void;
  onTileError: (tileX: number, tileY: number) => void;
}

const TILE_LOAD_CONFIG = {
  BATCH_SIZE: 4,
  MAX_TILES_TO_LOAD: 30,
  BATCH_DELAY: 100,
  BATCH_TIMEOUT: 5000,
  MAX_TILES_IN_MEMORY: 50
};

export class TileLoader {
  private tileCache: TileCache;
  private tileCacheReady = false;
  private inMemoryCache: Record<string, Tile> = {};
  private readonly maxTilesInMemory: number;

  constructor(maxTilesInMemory: number = TILE_LOAD_CONFIG.MAX_TILES_IN_MEMORY) {
    this.tileCache = new TileCache();
    this.maxTilesInMemory = maxTilesInMemory;
    this.initialize();
  }

  private async initialize() {
    try {
      await this.tileCache.init();
      this.tileCacheReady = true;
    } catch (error) {
      console.error('[TileLoader] Failed to initialize tile cache:', error);
    }
  }

  public getInMemoryCache(): Record<string, Tile> {
    return { ...this.inMemoryCache };
  }

  public async loadTile(
    tileX: number,
    tileY: number,
    options: LoadTileOptions
  ): Promise<void> {
    const {
      forceRefresh = false,
      isMounted,
      currentMountId,
      viewport,
      onTileLoaded,
      onTileError
    } = options;

    // Enforce maximum number of tiles in memory
    if (Object.keys(this.inMemoryCache).length >= this.maxTilesInMemory) {
      this.evictOldestTiles(viewport());
    }
    
    const key = this.getTileKey(tileX, tileY);
    const currentTile = this.inMemoryCache[key];
    
    // Skip if already loading the same tile, unless we're forcing a refresh
    if (currentTile?.loading && !forceRefresh) {
      return;
    }
    
    // Skip if component is unmounting
    if (!isMounted()) {
      return;
    }

    // Check cache first if not forcing a refresh
    if (!forceRefresh) {
      try {
        const cachedTile = await this.tileCache.getTile(tileX, tileY);
        if (cachedTile) {
          const tile = this.createTile(tileX, tileY, {
            data: cachedTile.data,
            fromCache: true,
            mountId: currentMountId
          });
          
          this.inMemoryCache[key] = tile;
          onTileLoaded(tile);
          
          // Schedule a background refresh if needed
          const tileAge = Date.now() - cachedTile.timestamp;
          const refreshThreshold = 20 * 1000; // 20 seconds
          if (tileAge > refreshThreshold) {
            this.loadTile(tileX, tileY, { ...options, forceRefresh: true }).catch(console.error);
          }
          
          return; // Skip fetch if we have a valid cached version
        }
      } catch (error) {
        console.error(`[TileLoader] Error reading from cache for tile (${tileX}, ${tileY}):`, error);
      }
    }
    
    // Mark as loading but keep existing data
    this.inMemoryCache[key] = {
      ...(currentTile || { x: tileX, y: tileY, data: null, loading: false, error: false, timestamp: 0 }),
      loading: true,
      error: false,
      mountId: currentMountId
    };
    
    try {
      const response = await this.fetchTileData(tileX, tileY);
      
      if (!isMounted()) {
        console.log(`[TileLoader] Component unmounted during fetch for tile (${tileX}, ${tileY})`);
        return;
      }
      
      const bytes = this.processTileData(response.data);
      
      // Cache the processed tile data
      try {
        await this.tileCache.setTile(tileX, tileY, bytes);
      } catch (cacheError) {
        console.error(`[TileLoader] Error caching tile (${tileX}, ${tileY}):`, cacheError);
      }
      
      // Only update state if we're still mounted
      if (isMounted()) {
        const tile = this.createTile(tileX, tileY, {
          data: bytes,
          fromCache: false,
          mountId: currentMountId
        });
        
        this.inMemoryCache[key] = tile;
        onTileLoaded(tile);
      }
    } catch (err) {
      // Don't log aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      console.error(`[TileLoader] Error loading tile (${tileX}, ${tileY}):`, err);
      
      // Only update error state if we're still mounted
      if (isMounted()) {
        this.inMemoryCache[key] = {
          ...(this.inMemoryCache[key] || { x: tileX, y: tileY, data: null, loading: false, error: false, timestamp: 0 }),
          loading: false,
          error: true,
          timestamp: Date.now(),
          mountId: currentMountId
        };
        onTileError(tileX, tileY);
      }
    }
  }

  private evictOldestTiles(viewport: { x: number; y: number }) {
    const vpx = Math.floor(viewport.x / 64);
    const vpy = Math.floor(viewport.y / 64);
    
    // Find tiles that are not currently loading, sorted by distance from viewport
    const tilesArray = Object.entries(this.inMemoryCache)
      .filter(([_, tile]) => !tile.loading)
      .sort((a, b) => {
        const distA = Math.abs(a[1].x - vpx) + Math.abs(a[1].y - vpy);
        const distB = Math.abs(b[1].x - vpx) + Math.abs(b[1].y - vpy);
        return -(distA - distB);
      });
    
    // Remove the oldest tiles until we're under the limit
    const tilesToRemove = Object.keys(this.inMemoryCache).length - this.maxTilesInMemory + 5; // Remove a few extra to reduce churn
    for (let i = 0; i < tilesToRemove && i < tilesArray.length; i++) {
      delete this.inMemoryCache[tilesArray[i][0]];
    }
  }

  private async fetchTileData(tileX: number, tileY: number): Promise<{ data: any }> {
    // Wait for tile cache to be ready
    if (!this.tileCacheReady) {
      try {
        await this.tileCache.init();
        this.tileCacheReady = true;
      } catch (error) {
        console.error(`[TileLoader] Error initializing tile cache:`, error);
      }
    }
    
    const authToken = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const headers: HeadersInit = { 'Accept': 'application/json' };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`/api/map/tile/${tileX}/${tileY}`, { 
      headers,
      credentials: 'include' // Include cookies for session-based auth
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.error(`[TileLoader] Invalid response format for tile (${tileX}, ${tileY}):`, responseData);
      throw new Error('Invalid response format');
    }
    
    return responseData;
  }

  private processTileData(tileData: any): Uint8Array {
    // Process tile data
    if (typeof tileData.data === 'string') {
      const numbers = tileData.data.split(',').map(Number);
      if (numbers.some(isNaN)) {
        throw new Error('Invalid number in tile data');
      }
      return new Uint8Array(numbers);
    } else if (Array.isArray(tileData.data)) {
      return new Uint8Array(tileData.data);
    } else {
      throw new Error('Unexpected tile data format');
    }
  }

  private createTile(
    x: number, 
    y: number, 
    options: {
      data: Uint8Array | null;
      fromCache: boolean;
      mountId: number;
    }
  ): Tile {
    return {
      x,
      y,
      data: options.data,
      loading: false,
      error: false,
      timestamp: Date.now(),
      mountId: options.mountId,
      fromCache: options.fromCache
    };
  }

  private getTileKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}

// Helper function to create a cancellable operation
export function createCancellableOperation() {
  const controller = new AbortController();
  const signal = controller.signal;
  
  const cleanup = () => {
    if (!signal.aborted) {
      controller.abort();
    }
  };
  
  return { signal, cleanup };
}
