const DB_NAME = 'mapTilesDB';
const STORE_NAME = 'tiles';
const VERSION = 1;
const MAX_TILES = 100; // Maximum number of tiles to keep in memory

interface TileCacheEntry {
  x: number;
  y: number;
  data: Uint8Array;
  timestamp: number;
  etag?: string;
}

export class TileCache {
  private db: IDBDatabase | null = null;
  private dbName = DB_NAME;
  private storeName = STORE_NAME;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private maxAge = 30 * 1000; // 30 seconds in milliseconds
  private refreshThreshold = 20 * 1000; // Start refreshing 20s after last update
  private lastUpdateTime = 0;
  private refreshInterval: number | null = null;
  private accessTimes = new Map<string, number>(); // Track when tiles were last accessed

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    console.log('[TileCache] Initializing IndexedDB...');
    if (this.isInitialized) {
      console.log('[TileCache] Already initialized');
      return;
    }

    if (this.initPromise) {
      console.log('[TileCache] Initialization already in progress, waiting...');
      return this.initPromise;
    }
    
    console.log('[TileCache] Starting new initialization');

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        console.log('[TileCache] Skipping IndexedDB initialization in SSR');
        this.isInitialized = true;
        resolve();
        return;
      }

      console.log(`[TileCache] Opening IndexedDB: ${this.dbName} v${VERSION}`);
      const request = indexedDB.open(this.dbName, VERSION);
      
      request.onblocked = (event) => {
        console.error('[TileCache] Database access blocked:', event);
        reject(new Error('Database access is blocked'));
      };
      
      request.onerror = (event) => {
        const target = event.target as IDBRequest;
        console.error('[TileCache] Error opening IndexedDB:', {
          error: target.error,
          name: target.error?.name,
          message: target.error?.message,
          type: event.type,
          dbName: this.dbName,
          version: VERSION
        });
        reject(target.error || new Error('Unknown error opening database'));
      };

      request.onerror = (event) => {
        const target = event.target as IDBRequest;
        console.error('[TileCache] Error opening IndexedDB:', {
          error: target.error,
          type: event.type,
          target: target
        });
        const error = target.error || new Error('Unknown error opening IndexedDB');
        reject(error);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.db = db;
        this.isInitialized = true;
        
        // Log database info
        console.log(`[TileCache] Database '${DB_NAME}' v${VERSION} ready`);
        console.log(`[TileCache] Object stores:`, Array.from(db.objectStoreNames));
        
        // Verify the store exists and is accessible
        if (db.objectStoreNames.contains('tiles')) {
          const transaction = db.transaction(['tiles'], 'readonly');
          const store = transaction.objectStore('tiles');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            console.log(`[TileCache] Found ${countRequest.result} tiles in the store`);
          };
          
          countRequest.onerror = (e) => {
            console.error('[TileCache] Error counting tiles:', e);
          };
        } else {
          console.error('[TileCache] Tiles store not found in database!');
        }
        
        // Start cleanup in the background
        this.cleanupOldTiles().catch(console.error);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`[TileCache] Database upgrade needed for ${this.dbName} v${event.oldVersion} -> v${event.newVersion}`);
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.log(`[TileCache] Creating object store: ${this.storeName}`);
          try {
            const store = db.createObjectStore(this.storeName, { keyPath: ['x', 'y'] });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            console.log('[TileCache] Object store and index created');
          } catch (error) {
            console.error('[TileCache] Error creating object store:', error);
            throw error;
          }
        } else {
          console.log(`[TileCache] Object store ${this.storeName} already exists`);
        }
      };
    });

    return this.initPromise;
  }

  private getStore(mode: IDBTransactionMode): IDBObjectStore | null {
    if (typeof window === 'undefined') {
      console.error('[TileCache] Not in browser environment');
      return null;
    }
    
    if (!this.db) {
      console.error('[TileCache] Database not initialized');
      return null;
    }
    
    try {
      const transaction = this.db.transaction([STORE_NAME], mode);
      
      transaction.onerror = (event) => {
        console.error('[TileCache] Transaction error:', (event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
      };
      
      transaction.onabort = (event) => {
        console.error('[TileCache] Transaction aborted:', (event.target as IDBRequest).error);
      };
      
      return transaction.objectStore(STORE_NAME);
    } catch (error) {
      console.error('[TileCache] Error getting store:', error);
      return null;
    }
  }

  private async deleteTile(x: number, y: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      if (!store) {
        reject(new Error('Failed to get store for deletion'));
        return;
      }

      const deleteRequest = store.delete([x, y]);
      
      deleteRequest.onsuccess = () => {
        this.accessTimes.delete(`${x},${y}`);
        resolve();
      };
      
      deleteRequest.onerror = (event) => {
        console.error(`[TileCache] Error deleting tile (${x},${y}):`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async getTile(x: number, y: number, forceRefresh = false): Promise<TileCacheEntry | null> {
    if (!this.isInitialized) {
      try {
        await this.init();
      } catch (error) {
        console.error('[TileCache] Error initializing in getTile:', error);
        return null;
      }
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Only force refresh if explicitly requested
    if (forceRefresh) {
      return null;
    }
    
    // Update access time for this tile
    const tileKey = `${x},${y}`;
    this.accessTimes.set(tileKey, Date.now());

    try {
      const store = this.getStore('readonly');
      if (!store) {
        console.error('[TileCache] Failed to get store');
        return null;
      }

      const getRequest = store.get([x, y]);
      
      return new Promise((resolve) => {
        getRequest.onsuccess = () => {
          const result = getRequest.result as TileCacheEntry | undefined;
          if (!result) {
            resolve(null);
            return;
          }

          const age = Date.now() - result.timestamp;
          const isExpired = age > this.maxAge;
          
          if (!isExpired) {
            resolve(result);
          } else {
            // Delete expired tile using a separate write transaction
            this.deleteTile(x, y)
              .then(() => {
                console.log(`[TileCache] Deleted expired tile (${x},${y})`);
                resolve(null);
              })
              .catch((error) => {
                console.error(`[TileCache] Error deleting expired tile (${x},${y}):`, error);
                resolve(null);
              });
          }
        };

        getRequest.onerror = () => {
          console.error(`[TileCache] Error checking tile (${x},${y}):`, getRequest.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error(`[TileCache] Error in getTile for (${x},${y}):`, error);
      return null;
    }
  }

  async setTile(x: number, y: number, data: Uint8Array, etag?: string): Promise<void> {
    if (!this.isInitialized) {
      try {
        await this.init();
      } catch (error) {
        console.error('[TileCache] Error initializing in setTile:', error);
        throw error;
      }
    }
    
    // Update last update time
    this.lastUpdateTime = Date.now();
    
    // Update access time for this tile
    const tileKey = `${x},${y}`;
    this.accessTimes.set(tileKey, Date.now());
    
    // Check if we need to evict tiles due to MAX_TILES limit
    const currentSize = await this.getCacheSize();
    if (currentSize >= MAX_TILES) {
      await this.evictLRUTiles(currentSize - MAX_TILES + 1);
    }
    
    // If we don't have a refresh interval set up, schedule one
    if (!this.refreshInterval) {
      this.scheduleNextCleanup();
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readwrite');
        if (!store) {
          const error = new Error('Failed to access IndexedDB store');
          console.error('[TileCache]', error);
          reject(error);
          return;
        }

        const entry: TileCacheEntry = {
          x,
          y,
          data,
          timestamp: Date.now(),
          etag
        };
        
        const request = store.put(entry);
        
        request.onsuccess = () => {
          
          // Verify the tile was stored
          store.get([x, y]).onsuccess = (e) => {
            const result = (e.target as IDBRequest).result;
            if (result) {
            } else {
              console.error(`[TileCache] Failed to verify tile (${x}, ${y}) was stored`);
            }
            resolve();
          };
        };
        
        request.onerror = (event) => {
          const error = request.error || new Error('Unknown error setting tile in cache');
          console.error(`[TileCache] Error storing tile (${x}, ${y}):`, {
            error,
            event: event.type,
            target: (event.target as IDBRequest).result
          });
          reject(error);
        };
      } catch (error) {
        console.error('Error in setTile:', error);
        reject(error);
      }
    });
  }


  async clear(): Promise<void> {
    // ... (rest of the method remains the same)
  }

  async cleanupOldTiles(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        console.log('[TileCache] No database to clean up');
        resolve();
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const now = Date.now();
      const threshold = now - this.maxAge;

      const request = index.openCursor(IDBKeyRange.upperBound(threshold));
      const keysToDelete: [number, number][] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          keysToDelete.push([cursor.value.x, cursor.value.y]);
          cursor.continue();
        } else {
          // Delete all old tiles in a single transaction
          if (keysToDelete.length > 0) {
            const deleteTransaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const deleteStore = deleteTransaction.objectStore(STORE_NAME);
            
            keysToDelete.forEach(([x, y]) => {
              deleteStore.delete([x, y]);
            });

            deleteTransaction.oncomplete = () => {
              this.scheduleNextCleanup();
              resolve();
            };

            deleteTransaction.onerror = (e) => {
              console.error('[TileCache] Error deleting old tiles:', e);
              resolve();
            };
          } else {
            this.scheduleNextCleanup();
            resolve();
          }
        }
      };

      request.onerror = (e) => {
        console.error('[TileCache] Error cleaning up old tiles:', e);
        resolve();
      };
    });
  }

  private async evictLRUTiles(count: number): Promise<void> {
    if (count <= 0) return;
    
    // Get all tiles with their last access times
    const tiles = Array.from(this.accessTimes.entries())
      .map(([key, lastAccess]) => ({
        key,
        lastAccess,
        coords: key.split(',').map(Number) as [number, number]
      }))
      .sort((a, b) => a.lastAccess - b.lastAccess);
    
    // Remove the least recently used tiles
    const tilesToRemove = tiles.slice(0, count);
    for (const { coords: [x, y], key } of tilesToRemove) {
      await this.deleteTile(x, y);
      this.accessTimes.delete(key);
    }
  }

  private scheduleNextCleanup() {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
    }
    
    // Schedule next cleanup in 10 seconds
    this.refreshInterval = window.setTimeout(() => {
      this.cleanupOldTiles().catch(console.error);
    }, 10000);
  }

  async getCacheSize(): Promise<number> {
    if (!this.isInitialized) {
      await this.init();
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      return 0;
    }

    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readonly');
        if (!store) {
          resolve(0);
          return;
        }

        const request = store.count();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          const error = request.error || new Error('Unknown error getting cache size');
          console.error('Error getting cache size', error);
          resolve(0);
        };
      } catch (error) {
        console.error('Error in getCacheSize:', error);
        resolve(0);
      }
    });
  }
}

// Export a singleton instance
export const tileCache = new TileCache();
