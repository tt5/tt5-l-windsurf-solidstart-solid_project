const DB_NAME = 'mapTilesDB';
const STORE_NAME = 'tiles';
const VERSION = 1;

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
      console.log(`[TileCache] Getting store '${STORE_NAME}' in mode '${mode}'`);
      const transaction = this.db.transaction([STORE_NAME], mode);
      
      transaction.onerror = (event) => {
        console.error('[TileCache] Transaction error:', (event.target as IDBRequest).error);
      };
      
      transaction.oncomplete = () => {
        console.log('[TileCache] Transaction completed');
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

  async getTile(x: number, y: number, forceRefresh = false): Promise<TileCacheEntry | null> {
    console.log(`[TileCache] getTile called for (${x}, ${y})`, { forceRefresh });
    
    if (!this.isInitialized) {
      console.log('[TileCache] Initializing before getTile');
      try {
        await this.init();
        console.log('[TileCache] Initialization completed in getTile');
      } catch (error) {
        console.error('[TileCache] Error initializing in getTile:', error);
        return null;
      }
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      console.log('[TileCache] Skipping getTile in non-browser environment');
      return null;
    }
    
    // Only force refresh if explicitly requested
    if (forceRefresh) {
      console.log(`[TileCache] Force refresh requested for tile (${x}, ${y})`);
      return null;
    }

    return new Promise((resolve) => {
      try {
        console.log(`[TileCache] Getting store for (${x}, ${y})`);
        const store = this.getStore('readonly');
        if (!store) {
          console.error('[TileCache] Failed to get store');
          resolve(null);
          return;
        }

        console.log(`[TileCache] Querying for tile (${x}, ${y})`);
        const request = store.get([x, y]);
        
        request.onsuccess = () => {
          const result = request.result as TileCacheEntry | undefined;
          if (result) {
            const age = Date.now() - result.timestamp;
            const isExpired = age > this.maxAge;
            console.log(`[TileCache] Cache ${isExpired ? 'expired' : 'hit'} for (${x}, ${y})`, {
              age,
              maxAge: this.maxAge,
              isExpired,
              entry: result
            });
            
            if (!isExpired) {
              resolve(result);
            } else {
              // Delete expired entry
              const deleteRequest = store.delete([x, y]);
              deleteRequest.onsuccess = () => {
                console.log(`[TileCache] Deleted expired cache entry for (${x}, ${y})`);
                resolve(null);
              };
              deleteRequest.onerror = (e) => {
                console.error(`[TileCache] Error deleting expired cache entry for (${x}, ${y}):`, e);
                resolve(null);
              };
            }
          } else {
            console.log(`[TileCache] Cache miss for (${x}, ${y})`);
            resolve(null);
          }
        };
        
        request.onerror = (event) => {
          const error = request.error || new Error('Unknown error getting tile from cache');
          console.error(`[TileCache] Error getting tile (${x}, ${y}):`, {
            error,
            event: event.type,
            target: (event.target as IDBRequest).result
          });
          resolve(null);
        };
      } catch (error) {
        console.error('Error in getTile:', error);
        resolve(null);
      }
    });
  }

  async setTile(x: number, y: number, data: Uint8Array, etag?: string): Promise<void> {
    console.log(`[TileCache] setTile called for (${x}, ${y})`);
    
    if (!this.isInitialized) {
      console.log('[TileCache] Initializing before setTile');
      try {
        await this.init();
        console.log('[TileCache] Initialization completed in setTile');
      } catch (error) {
        console.error('[TileCache] Error initializing in setTile:', error);
        throw error;
      }
    }
    
    // Update last update time
    this.lastUpdateTime = Date.now();
    
    // If we don't have a refresh interval set up, schedule one
    if (!this.refreshInterval) {
      this.scheduleNextCleanup();
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      console.log('[TileCache] Skipping setTile in non-browser environment');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`[TileCache] Getting store for (${x}, ${y})`);
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
        
        console.log(`[TileCache] Storing tile (${x}, ${y}) at ${new Date(entry.timestamp).toISOString()}`);
        console.log(`[TileCache] Data length: ${data.length} bytes`);
        
        const request = store.put(entry);
        
        request.onsuccess = () => {
          console.log(`[TileCache] Successfully stored tile (${x}, ${y})`);
          
          // Verify the tile was stored
          store.get([x, y]).onsuccess = (e) => {
            const result = (e.target as IDBRequest).result;
            if (result) {
              console.log(`[TileCache] Verified tile (${x}, ${y}) is in store`);
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

  async deleteTile(x: number, y: number): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readwrite');
        if (!store) {
          reject(new Error('Failed to access IndexedDB store'));
          return;
        }

        const request = store.delete([x, y]);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          const error = request.error || new Error('Unknown error deleting tile');
          console.error('Error deleting tile from cache', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error in deleteTile:', error);
        reject(error);
      }
    });
  }

  async clear(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore('readwrite');
        if (!store) {
          reject(new Error('Failed to access IndexedDB store'));
          return;
        }

        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          const error = request.error || new Error('Unknown error clearing cache');
          console.error('Error clearing cache', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error in clear:', error);
        reject(error);
      }
    });
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
              console.log(`[TileCache] Deleted ${keysToDelete.length} old tiles`);
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

  private scheduleNextCleanup() {
    if (this.refreshInterval) {
      console.log('[TileCache] Clearing existing cleanup interval');
      clearTimeout(this.refreshInterval);
    }
    
    // Schedule next cleanup in 10 seconds
    const cleanupTime = Date.now() + 10000;
    console.log(`[TileCache] Scheduling next cleanup at ${new Date(cleanupTime).toISOString()}`);
    
    this.refreshInterval = window.setTimeout(() => {
      console.log('[TileCache] Running scheduled cleanup');
      this.cleanupOldTiles()
        .then(() => console.log('[TileCache] Cleanup completed'))
        .catch(error => console.error('[TileCache] Error during cleanup:', error));
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
