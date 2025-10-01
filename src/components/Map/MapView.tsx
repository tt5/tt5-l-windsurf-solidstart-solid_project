
import { Component, createEffect, createSignal, onCleanup, onMount, batch, JSX } from 'solid-js';
import { TileCache } from '../../lib/client/services/tile-cache';
import ViewportPosition from './ViewportPosition';
import { 
  renderBitmap, 
  TILE_SIZE, 
  isTileStale, 
  getTileKey, 
  worldToTileCoords, 
  tileToWorldCoords,
  getInitialViewport,
  handleResize as handleViewportResize,
  loadVisibleTiles as loadVisibleTilesUtil,
  updateViewport as updateViewportUtil,
  generateSpiralCoords
} from '../../utils/mapUtils';

import styles from './MapView.module.css';

// TILE_SIZE is now imported from mapUtils

const TILE_LOAD_CONFIG = {
  BATCH_SIZE: 4,                  // Reduced to load fewer tiles at once
  MAX_TILES_TO_LOAD: 30,          // Reduced maximum queue size
  BATCH_DELAY: 100,               // Delay between batch processing in ms
  BATCH_TIMEOUT: 5000,            // Timeout for batch tile loading in ms
  MAX_TILES_IN_MEMORY: 50       // Maximum number of tiles to keep in memory
};

const VIEWPORT_WIDTH = 800; // 800 pixels
const VIEWPORT_HEIGHT = 600; // 600 pixels

interface Tile {
  x: number;
  y: number;
  data: Uint8Array | null;
  loading: boolean;
  error: boolean;
  timestamp: number;
  mountId: number;
  fromCache?: boolean;
}

interface Viewport {
  x: number;
  y: number;
width: number;
  height: number;
}

const MapView: Component = () => {
  const [tiles, setTiles] = createSignal<Record<string, Tile>>({});
  let containerRef: HTMLDivElement | undefined;
  const [viewport, setViewport] = createSignal<Viewport>(
    getInitialViewport(containerRef, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
  );
  
  // Clear any existing tiles to force a reload
  setTiles({});
  const [isDragging, setIsDragging] = createSignal(false);
  const [lastMousePosition, setLastMousePosition] = createSignal<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = createSignal({ 
    x: 0, 
    y: 0,
    startX: 0,
    startY: 0 
  });
  const [isLoading, setIsLoading] = createSignal(false);
  
  const tileCache = new TileCache(); // Initialize tile cache at component level
  let tileCacheReady = false;
  tileCache.init().then(() => {
    tileCacheReady = true;
  }).catch(error => {
    console.error('[MapView] Failed to initialize tile cache:', error);
  });

  const [tileQueue, setTileQueue] = createSignal<Array<{x: number, y: number}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = createSignal(false);
  // Track active operations and state
  const activeOperations = new Set<AbortController>();
  let processQueueTimeout: number | null = null;
  let shouldStopProcessing = false;
  
  // Handle window resize to update viewport dimensions
  const handleResize = () => {
    handleViewportResize(containerRef, setViewport, scheduleTilesForLoading);
  };

  // Track mount state and mount ID
  const [isMounted, setIsMounted] = createSignal(false);
  const currentMountId = Math.floor(Math.random() * 1000000);
  
  // Function to load all visible tiles
  const loadVisibleTiles = () => {
    loadVisibleTilesUtil(tiles(), isMounted, isTileStale, loadTile);
  };

  // Set mount state when component mounts
  onMount(() => {
    setIsMounted(true);
    loadVisibleTiles();
    
    // Set up interval to check for stale tiles every 10 seconds
    const intervalId = setInterval(() => {
      if (isMounted()) {
        loadVisibleTiles();
      }
    }, 10 * 1000); // 10 seconds

    // Add window resize event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
      setIsMounted(false);
    };
  });

  // Initial load effect
  createEffect(() => {
    // Initial tile loading function
    const initialLoad = () => {
      if (!isMounted()) return;
      console.log(`[MapView] Effect initialLoad`)
      
      // Update viewport with actual dimensions
      const width = containerRef?.clientWidth || VIEWPORT_WIDTH;
      const height = containerRef?.clientHeight || VIEWPORT_HEIGHT;
      console.log(`[MapView] Effect initialLoad width: ${width}, height: ${height}`)
      
      setViewport(prev => ({
        ...prev,
        width,
        height
      }));
    };
    
    // Schedule initial load after a short delay to ensure DOM is ready
    const loadTimer = setTimeout(() => {
      if (isMounted()) {
        initialLoad();
      }
    }, 50);
    
    // Clean up timer on unmount
    onCleanup(() => {
      clearTimeout(loadTimer);
    });
  }); // End of createEffect;

  // Update viewport and schedule tiles for loading
  const updateViewport = (updates: Partial<Viewport>) => {
    updateViewportUtil(updates, setViewport, scheduleTilesForLoading);
  };
  
  // Schedule tiles for loading based on current viewport
  const scheduleTilesForLoading = (specificTiles?: Array<{x: number, y: number}>) => {

    // If specific tiles are provided, just process those
    const vp = viewport();
    const vpx = Math.floor(Math.abs(vp.x)/64);
    const vpy = Math.floor(Math.abs(vp.y)/64);
    if(vpx > 16 || vpy > 16) return;
    
    if (specificTiles && specificTiles.length > 0) {
      setTileQueue(prev => {
        const newQueue = [...prev];
        // Add only tiles that aren't already in the queue
        specificTiles.forEach(tile => {
          const exists = newQueue.some(t => t.x === tile.x && t.y === tile.y);
          if (!exists) {
            newQueue.push(tile);
          }
        });
        return newQueue;
      });
      
      // Always process the queue when specific tiles are provided
      processTileQueue();
      return;
    }
    
    if (shouldStopProcessing) return;
    
    const currentQueue = tileQueue();
    const queueLength = currentQueue.length;
    
    // If queue is full, skip scheduling more tiles
    if (queueLength >= TILE_LOAD_CONFIG.MAX_TILES_TO_LOAD) {
      processTileQueue();
      return;
    }
    
    const spiralRadius = 2; // Original spiral radius
    
    const tileCoords = worldToTileCoords(vp.x,vp.y);
    const spiralCoords = generateSpiralCoords(tileCoords.tileX, tileCoords.tileY, spiralRadius);
    
    // Filter and prioritize tiles
    const visibleTiles: Array<{x: number, y: number, priority: number}> = [];
    const queueSet = new Set(currentQueue.map(t => `${t.x},${t.y}`));

    for (const {x, y, distance} of spiralCoords) {
      const key = `${x},${y}`;
      const existingTile = tiles()[key];
      
      // Skip if already loaded or loading
      if (existingTile?.data || existingTile?.loading) continue;
      
      // Skip if already in queue
      if (queueSet.has(key)) continue;
      
      visibleTiles.push({
        x, y,
        priority: distance // Closer tiles have higher priority (lower number)
      });
    }
    
    // Sort by priority (closest first)
    visibleTiles.sort((a, b) => a.priority - b.priority);
    
    // Limit the number of tiles to add based on queue capacity
    const maxTilesToAdd = Math.max(0, TILE_LOAD_CONFIG.MAX_TILES_TO_LOAD - queueLength);
    const tilesToLoad = visibleTiles.slice(0, maxTilesToAdd);
    
    // Add to queue if we have tiles to load
    if (tilesToLoad.length > 0) {
      
      setTileQueue(prev => {
        const newQueue = [...prev];
        const existingSet = new Set(newQueue.map(t => `${t.x},${t.y}`));
        
        // Only add tiles that aren't already in the queue
        for (const tile of tilesToLoad) {
          const key = `${tile.x},${tile.y}`;
          if (!existingSet.has(key)) {
            newQueue.push({x: tile.x, y: tile.y});
            existingSet.add(key);
          }
        }
        
        return newQueue;
      });
      
      // Process the queue if not already processing
      if (!isProcessingQueue()) {
        setTimeout(processTileQueue, 0);
      }
    }
  };

  // Cleanup on unmount
  onCleanup(() => {
    if (!isMounted()) return;
    
    shouldStopProcessing = true;
    setIsMounted(false);
    
    // Clear any pending timeouts first
    if (processQueueTimeout !== null) {
      clearTimeout(processQueueTimeout);
      processQueueTimeout = null;
    }
    
    // Abort all active operations
    const operations = Array.from(activeOperations);
    activeOperations.clear();
    
    operations.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        console.warn('Error aborting operation:', e);
      }
    });
    
    // Clear the queue and tiles in a single batch update
    batch(() => {
      setTileQueue([]);
      setTiles({});
    });
    
  });
  
  // Helper to create a cancellable operation
  const createCancellableOperation = () => {
    if (!isMounted()) {
      throw new Error('Cannot create operation - component not mounted');
    }
    
    const controller = new AbortController();
    activeOperations.add(controller);
    
    return {
      signal: controller.signal,
      cleanup: () => {
        activeOperations.delete(controller);
      }
    };
  };

  // Process the tile loading queue with priority to visible tiles
  const processTileQueue = async () => {
    // Don't process if we're already processing or should stop
    if (isProcessingQueue() || !isMounted()) {
      return;
    }
    
    // Clear any existing timeout
    if (processQueueTimeout) {
      clearTimeout(processQueueTimeout);
      processQueueTimeout = null;
    }
    
    try {
      setIsProcessingQueue(true);
      
      // Check mount state after async operations
      if (!isMounted()) {
        return;
      }
      
      // Get current queue and check if it's empty
      const currentQueue = tileQueue();
      if (currentQueue.length === 0) {
        return;
      }
      
      // Process tiles in batches
      const batchSize = Math.min(TILE_LOAD_CONFIG.BATCH_SIZE, currentQueue.length);
      const batch = currentQueue.slice(0, batchSize);
      
      // Process each tile in the batch with mount checks
      const tilePromises = batch.map(({ x, y }) => 
        loadTile(x, y).catch(error => {
          if (isMounted()) {
            console.error(`[processTileQueue] Error loading tile (${x},${y}):`, error);
          }
          return null;
        })
      );
      
      // Wait for all tiles in the batch to complete with a timeout
      await Promise.race([
        Promise.all(tilePromises),
        new Promise(resolve => setTimeout(resolve, TILE_LOAD_CONFIG.BATCH_TIMEOUT || 5000))
      ]);
      
      // Check mount state before updating state
      if (!isMounted()) {
        return;
      }
      
      // Remove processed tiles from the queue
      setTileQueue(prev => {
        const processedCoords = new Set(batch.map(t => `${t.x},${t.y}`));
        return prev.filter(tile => !processedCoords.has(`${tile.x},${tile.y}`));
      });
      
      // If there are more tiles to process, schedule the next batch
      const remainingTiles = tileQueue().length;
      if (remainingTiles > 0 && isMounted()) {
        processQueueTimeout = window.setTimeout(() => {
          if (isMounted()) {
            processTileQueue();
          }
        }, TILE_LOAD_CONFIG.BATCH_DELAY);
      } else {
        console.log('[processTileQueue] Queue processing complete');
      }
    } catch (error) {
      if (isMounted()) {
        console.error('[processTileQueue] Error in queue processing:', error);
      }
    } finally {
      if (isMounted()) {
        setIsProcessingQueue(false);
      }
    }
  };

  // Load a single tile
  const loadTile = async (tileX: number, tileY: number, forceRefresh = false): Promise<void> => {
    
    // Enforce maximum number of tiles in memory
    const currentTiles = tiles();
    if (Object.keys(currentTiles).length >= TILE_LOAD_CONFIG.MAX_TILES_IN_MEMORY) {

      const vp = viewport();
      const vpx = Math.floor((vp.x)/64);
      const vpy = Math.floor((vp.y)/64);
    
      // Find the oldest accessed tile that's not currently loading
      const tilesArray = Object.entries(currentTiles)
        .filter(([_, tile]) => !tile.loading)
        .sort((a, b) => {
          const distA = Math.abs(a[1].x - vpx) + Math.abs(a[1].y - vpy);
          const distB = Math.abs(b[1].x - vpx) + Math.abs(b[1].y - vpy);
          return -(distA - distB);
        });
          
      if (tilesArray.length > 0) {
        // Remove the oldest tile
        const [oldestKey] = tilesArray[0];
        setTiles(prev => {
          const newTiles = { ...prev };
          delete newTiles[oldestKey];
          return newTiles;
        });
      }
    }
    
    // Wait for tile cache to be ready
    if (!tileCacheReady) {
      try {
        await tileCache.init();
        tileCacheReady = true;
      } catch (error) {
        console.error(`[loadTile] Error initializing tile cache:`, error);
      }
    }
    
    const key = getTileKey(tileX, tileY);
    const currentTile = currentTiles[key];
    
    // Skip if already loading the same tile, unless we're forcing a refresh
    if (currentTile?.loading) {
      if (!forceRefresh) {
        return;
      }
    }
    
    // Skip if component is unmounting
    if (!isMounted()) {
      return;
    }

    // Check cache first if not forcing a refresh
    if (!forceRefresh) {
      try {
        const cachedTile = await tileCache.getTile(tileX, tileY);
        if (cachedTile) {
          const tileAge = Date.now() - cachedTile.timestamp;
          setTiles(prev => ({
            ...prev,
            [key]: {
              x: tileX,
              y: tileY,
              data: cachedTile.data,
              loading: false,
              error: false,
              timestamp: Date.now(), // Update timestamp on access
              mountId: currentMountId,
              fromCache: true
            }
          }));
          
          // Schedule a background refresh if needed
          const refreshThreshold = 20 * 1000; // 20 seconds
          if (tileAge > refreshThreshold) {
            loadTile(tileX, tileY, true).catch(console.error);
          }
          
          return; // Skip fetch if we have a valid cached version
        }
      } catch (error) {
        console.error(`[loadTile] Error reading from cache for tile (${tileX}, ${tileY}):`, error);
      }
    }
    
    // Skip if already loading (duplicate check removed)
    
    // Mark as loading but keep existing data
    setTiles(prev => {
      const existingTile = prev[key];
      return {
        ...prev,
        [key]: {
          x: tileX,
          y: tileY,
          data: existingTile?.data || null, // Keep existing data
          loading: true,
          error: false,
          timestamp: existingTile?.timestamp || 0, // Keep existing timestamp
          mountId: currentMountId
        }
      };
    });

    let cleanupFn: (() => void) | null = null;
    
    try {
      // Create a cancellable operation
      const { signal, cleanup } = createCancellableOperation();
      cleanupFn = cleanup;
      
      
      // Get the auth token from session storage
      const authToken = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      
      const headers: HeadersInit = { 'Accept': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`/api/map/tile/${tileX}/${tileY}`, { 
        signal,
        headers,
        credentials: 'include' // Include cookies for session-based auth
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (!isMounted()) {
        console.log(`[loadTile] Component unmounted during fetch for tile (${tileX}, ${tileY})`);
        return;
      }
      
      if (!responseData.success || !responseData.data) {
        console.error(`[loadTile] Invalid response format for tile (${tileX}, ${tileY}):`, responseData);
        throw new Error('Invalid response format');
      }
      
      // Process tile data
      const tileData = responseData.data;
      let bytes: Uint8Array;

      // Convert data to Uint8Array based on its type
      if (typeof tileData.data === 'string') {
        const numbers = tileData.data.split(',').map(Number);
        if (numbers.some(isNaN)) {
          throw new Error('Invalid number in tile data');
        }
        bytes = new Uint8Array(numbers);
      } else if (Array.isArray(tileData.data)) {
        bytes = new Uint8Array(tileData.data);
      } else {
        throw new Error('Unexpected tile data format');
      }

      // Cache the processed tile data
      try {
        await tileCache.setTile(tileX, tileY, bytes);
      } catch (cacheError) {
        console.error(`[loadTile] Error caching tile (${tileX}, ${tileY}):`, cacheError);
      }
      
      // Only update state if we're still mounted
      if (isMounted()) {
        setTiles(prev => ({
          ...prev,
          [key]: {
            x: tileX,
            y: tileY,
            data: bytes,
            loading: false,
            error: false,
            timestamp: Date.now(),
            mountId: currentMountId,
            fromCache: false
          }
        }));
      }
    } catch (err) {
      // Don't log aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      // Only update error state if we're still mounted
      if (isMounted()) {
        setTiles(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] || { x: tileX, y: tileY }),
            loading: false,
            error: true,
            timestamp: Date.now(),
            mountId: currentMountId
          }
        }));
      }
    } finally {
      // Clean up the abort controller
      if (cleanupFn) {
        cleanupFn();
      }
    }
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    
    e.preventDefault();
    e.stopPropagation();
    
    const vp = viewport();
    setIsDragging(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY,
      startX: vp.x,
      startY: vp.y
    });
    
    // Prevent text selection during drag
    document.addEventListener('selectstart', preventDefault);
    document.body.style.cursor = 'grabbing';
  };

  // Handle mouse up for dragging
  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging()) {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(false);
      document.removeEventListener('selectstart', preventDefault);
      document.body.style.cursor = '';
      
      // Force a reflow to ensure smooth transition back to normal cursor
      const element = e.target as HTMLElement;
      element.style.display = 'none';
      void element.offsetHeight; // Trigger reflow
      element.style.display = '';
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    
    const currentMouse = { x: e.clientX, y: e.clientY };
    const lastMouse = lastMousePosition();
    
    if (lastMouse) {
      // Calculate movement in screen space
      const dx = currentMouse.x - lastMouse.x;
      const dy = currentMouse.y - lastMouse.y;
      
      if (dx === 0 && dy === 0) return; // No movement
      
      // Get current viewport state
      const vp = viewport();
      
      // Calculate new position in world space
      // Convert screen movement to world movement
      const newX = vp.x - dx;
      const newY = vp.y - dy;
      
      console.log(`[MapView] handleMouseMove newX: ${newX}, newY: ${newY}`)
      // Update viewport with new position
      updateViewport({
        x: newX,
        y: newY
      });
    }
    
    setLastMousePosition(currentMouse);
  };

  // Handle mouse leave for dragging
  const handleMouseLeave = (e: MouseEvent) => {
    if (isDragging()) {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(false);
      document.removeEventListener('selectstart', preventDefault);
      document.body.style.cursor = '';
    }
  };
  
  // Helper function to prevent default behavior
  const preventDefault = (e: Event) => {
    e.preventDefault();
    return false;
  };

  // Handle cursor cleanup on unmount
  onCleanup(() => {
    document.body.style.cursor = '';
    // Clear any pending queue and timeouts
    setTileQueue([]);
    if (processQueueTimeout) {
      clearTimeout(processQueueTimeout);
      processQueueTimeout = null;
    }
  });

  // Update tiles when viewport changes with debounce
  createEffect(() => {
    const vp = viewport();
    
    // Debounce the tile loading to avoid too many updates during rapid viewport changes
    const debounceTimer = setTimeout(() => {
      scheduleTilesForLoading();
    }, 50);
    
    return () => clearTimeout(debounceTimer);
  });

  
  // Generate a consistent color based on tile coordinates
  const getTileColor = (x: number, y: number): string => {
    const hue = (x * 13 + y * 7) % 360;
    return `hsl(${hue}, 70%, ${tiles()[`${x},${y}`]?.data ? '80%' : '90%'})`;
  };

  // Render a single tile
  const renderTile = (tile: Tile) => {
    const vp = viewport();
    
    // Calculate tile position in world coordinates (1 unit = 1 pixel)
    // tile.x+t tile.y+t also change TAG-t
    const tileWorldX = (tile.x+16) * TILE_SIZE;
    const tileWorldY = (tile.y+16) * TILE_SIZE;
    
    // Calculate position relative to the viewport
    // Since the viewport is centered, we need to adjust the position
    const posX = Math.round(tileWorldX);
    const posY = Math.round(tileWorldY);
    
    // Use the calculated positions
    const pixelAlignedX = posX;
    const pixelAlignedY = posY;
    
    // Initialize content with a default empty div
    let content: JSX.Element = <div></div>;
    
    if (tile.error) {
      // Error state
      content = (
        <div class={`${styles.fallbackTile} ${styles.error}`}>
          <div 
            class={styles.fallbackTileContent}
            data-coords={`${tile.x},${tile.y}`}
          >
            Error
          </div>
        </div>
      );
    } else if (tile.loading && (!tile.data || tile.data.length === 0)) {
      // Only show full loading state if we don't have any data yet
      content = (
        <div 
          class={`${styles.fallbackTile} loading`}
          style={{ '--tile-bg-color': getTileColor(tile.x, tile.y) } as JSX.CSSProperties}
        >
          <div 
            class={styles.fallbackTileContent}
            data-coords={`${tile.x},${tile.y}`}
          >
            <div class={styles.loadingSpinner} />
          </div>
        </div>
      );
    } else if (!tile.data || tile.data.length === 0) {
      // Empty tile state
      content = (
        <div 
          class={styles.fallbackTile}
          style={{ '--tile-bg-color': getTileColor(tile.x, tile.y) } as JSX.CSSProperties}
        >
          <div
            class={styles.fallbackTileContent}
            data-coords={`${tile.x},${tile.y}`}
          >
            <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
          </div>
        </div>
      );
    } else {
      try {
        // Get the black pixels array
        const blackPixels = renderBitmap(tile.data);
        //const tileImage = renderBitmap(tile.data);
        
        if (blackPixels.length > 0) {
          // Create an SVG with circles for each black pixel
          content = (
            <div class={styles.tileContent}>
              <svg 
                width={TILE_SIZE} 
                height={TILE_SIZE} 
                viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`}
                class={styles.tileSvg}
              >
                {blackPixels.map(({x, y}, index) => {
                  const circleAttrs = {
                    cx: x + 0.5,
                    cy: y + 0.5,
                    r: 2,
                    fill: 'black'
                  };
                  return (
                    <circle 
                      {...circleAttrs}
                      // @ts-ignore - key is a valid prop for list rendering
                      key={index}
                    />
                  );
                })}
              </svg>
              <div class={styles.tileLabel}>
                {tile.x},{tile.y}
                {tile.loading && <div class={styles.loadingIndicator} />}
              </div>
            </div>
          );
        } else {
          // Fallback to colored tile if no black pixels
          content = (
            <div 
              class={styles.fallbackTile}
              style={{ '--tile-bg-color': getTileColor(tile.x, tile.y) } as JSX.CSSProperties}
            >
              <div 
                class={styles.fallbackTileContent}
                data-coords={`${tile.x},${tile.y}`}
              />
            <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
            </div>
          );
        }
      } catch (error) {
        console.error('Error rendering tile:', error);
        content = (
          <div class={`${styles.fallbackTile} ${styles.error}`}>
            <div class={styles.fallbackTileContent}>
              Error
              <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
            </div>
          </div>
        );
      }
    }
    
    // Render the tile with pixel-aligned positions using CSS modules
    return (
      <div
        class={`${styles.tileContainer} ${styles.tile}`}
        style={{
          '--tile-pos-x': `${pixelAlignedX}px`,
          '--tile-pos-y': `${pixelAlignedY}px`,
          '--tile-size': `${TILE_SIZE}px`,
          '--tile-base-size': `${TILE_SIZE}px`
        }}
        data-tile-x={tile.x}
        data-tile-y={tile.y}
        data-world-x={tileWorldX}
        data-world-y={tileWorldY}
        data-pos-x={pixelAlignedX}
        data-pos-y={pixelAlignedY}
      >
        {content}
      </div>
    );
  };

  // Helper function to extract coordinates of black pixels from 1-bit bitmap
  const extractBlackPixels = (bitmap: Uint8Array): {x: number, y: number}[] => {
    const blackPixels: {x: number, y: number}[] = [];
    let pixelIndex = 0;
    
    for (let i = 0; i < bitmap.length && pixelIndex < TILE_SIZE * TILE_SIZE; i++) {
      const byte = bitmap[i];
      
      // Process each bit in the byte (MSB first)
      for (let bit = 7; bit >= 0 && pixelIndex < TILE_SIZE * TILE_SIZE; bit--, pixelIndex++) {
        if ((byte >> bit) & 1) {
          // Calculate x, y coordinates from pixel index
          const x = pixelIndex % TILE_SIZE;
          const y = Math.floor(pixelIndex / TILE_SIZE);
          blackPixels.push({x, y});
        }
      }
    }
    
    return blackPixels;
  };

  // renderBitmap is now imported from mapUtils.ts
  
  // Render all tiles in the world bounds
  const renderAllTiles = () => {
    const WORLD_MIN = -16;
    const WORLD_MAX = 16;
    const tileElements = [];
    
    for (let y = WORLD_MIN; y <= WORLD_MAX; y++) {
      for (let x = WORLD_MIN; x <= WORLD_MAX; x++) {
        const key = `${x},${y}`;
        const existingTile = tiles()[key];
        
        // Create a placeholder tile if it doesn't exist yet
        const tile = existingTile || {
          x,
          y,
          loading: false,
          error: false,
          data: null,
          mountId: currentMountId,
          timestamp: Date.now(),
          fromCache: false
        };
        
        tileElements.push(renderTile(tile));
      }
    }
    
    return tileElements;
  };

  return (
    <div
      class={styles.mapContainer}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div class={isDragging() ? styles.mapViewportDragging : styles.mapViewport}>
        <div 
          class={styles.mapContent}
          style={{
            '--translate-x': '0px',
            '--translate-y': '0px',
            // Center the map at (0,0)
            'transform': `translate(${-viewport().x - 16*64}px, ${-viewport().y - 16*64}px)`
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'z-index': 2
          }}>
            {renderAllTiles()}
          </div>
        </div>
      </div>
      
      {isLoading() && (
        <div class={styles.loadingOverlay}>
          Loading map...
        </div>
      )}
      
          <ViewportPosition />
      <div class={styles.controls}>
        <div class={styles.coordinates}>
          Tiles: {Object.keys(tiles()).length}
        </div>
      </div>
      
      {/* Add origin and tile position markers */}
    </div>
  );
};

export default MapView;
