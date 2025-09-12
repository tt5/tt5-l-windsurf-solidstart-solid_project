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
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Skip in SSR
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, VERSION);

      request.onerror = () => {
        const error = request.error || new Error('Unknown error opening IndexedDB');
        console.error('Error opening IndexedDB', error);
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        // Start cleanup in the background
        this.cleanupOldTiles().catch(console.error);
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: ['x', 'y'] });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private getStore(mode: IDBTransactionMode): IDBObjectStore | null {
    if (typeof window === 'undefined' || !this.db) return null;
    
    try {
      const transaction = this.db.transaction(STORE_NAME, mode);
      return transaction.objectStore(STORE_NAME);
    } catch (error) {
      console.error('Error getting store:', error);
      return null;
    }
  }

  async getTile(x: number, y: number): Promise<TileCacheEntry | null> {
    if (!this.isInitialized) {
      await this.init();
    }

    // Skip if not in a browser environment
    if (typeof window === 'undefined') {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const store = this.getStore('readonly');
        if (!store) {
          resolve(null);
          return;
        }

        const request = store.get([x, y]);
        
        request.onsuccess = () => {
          const result = request.result as TileCacheEntry | undefined;
          if (result && Date.now() - result.timestamp < this.maxAge) {
            resolve(result);
          } else {
            // If the tile is too old, delete it and return null
            if (result) {
              this.deleteTile(x, y).catch(console.error);
            }
            resolve(null);
          }
        };
        
        request.onerror = () => {
          console.error('Error getting tile from cache', request.error);
          resolve(null);
        };
      } catch (error) {
        console.error('Error in getTile:', error);
        resolve(null);
      }
    });
  }

  async setTile(x: number, y: number, data: Uint8Array, etag?: string): Promise<void> {
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

        const entry: TileCacheEntry = {
          x,
          y,
          data,
          timestamp: Date.now(),
          etag
        };

        const request = store.put(entry);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Error setting tile in cache', request.error);
          reject(request.error || new Error('Unknown error setting tile in cache'));
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

        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(Date.now() - this.maxAge);
        
        const request = index.openCursor(range);
        const deleteRequests: Promise<void>[] = [];
        
        request.onsuccess = (event: Event) => {
          try {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor) {
              const { x, y } = cursor.value;
              deleteRequests.push(this.deleteTile(x, y).catch(console.error));
              cursor.continue();
            } else {
              // All old tiles have been processed
              Promise.all(deleteRequests)
                .then(() => resolve())
                .catch(error => {
                  console.error('Error during cleanup of old tiles:', error);
                  resolve(); // Don't reject the entire cleanup if some deletions fail
                });
            }
          } catch (error) {
            console.error('Error in cleanup cursor handler:', error);
            resolve(); // Continue with cleanup even if there's an error
          }
        };
        
        request.onerror = () => {
          const error = request.error || new Error('Unknown error during cleanup');
          console.error('Error cleaning up old tiles', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error in cleanupOldTiles:', error);
        reject(error);
      }
    });
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
