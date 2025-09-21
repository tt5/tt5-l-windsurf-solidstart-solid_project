
import { Component, createEffect, createSignal, onCleanup, onMount, batch, JSX } from 'solid-js';
import { inflate } from 'pako';
import { useAuth } from '../../contexts/auth';
import { TileCache } from '../../lib/client/services/tile-cache';
import { getAffectedTiles } from '../../lib/server/utils/coordinate-utils';

// Initialize the tile cache
const tileCache = new TileCache();

// Wait for tile cache to be ready before any operations
let tileCacheReady = false;
tileCache.init().then(() => {
  tileCacheReady = true;
}).catch(error => {
  console.error('[MapView] Failed to initialize tile cache:', error);
});

import styles from './MapView.module.css';
import { $ } from '@faker-js/faker/dist/airline-D6ksJFwG';

// Constants
const TILE_SIZE = 64; // pixels

// Tile loading configuration
const TILE_LOAD_CONFIG = {
  BATCH_SIZE: 4,                  // Reduced to load fewer tiles at once
  SCREEN_BUFFER: 0,               // Number of screens to preload around the viewport
  MAX_TILES_TO_LOAD: 20,          // Reduced maximum queue size
  BATCH_DELAY: 100,                // Delay between batch processing in ms
  BATCH_TIMEOUT: 5000             // Timeout for batch tile loading in ms
};

const VIEWPORT_WIDTH = 800; // 800 pixels
const VIEWPORT_HEIGHT = 600; // 600 pixels
const TILES_X = Math.ceil(VIEWPORT_WIDTH / TILE_SIZE) + 2; // +2 for buffer tiles
const TILES_Y = Math.ceil(VIEWPORT_HEIGHT / TILE_SIZE) + 2; // +2 for buffer tiles
const MIN_ZOOM = 1.0; // 50% zoom
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1; // 10% zoom step

// Types
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
  zoom: number;
  width: number;
  height: number;
}

const MapView: Component = () => {
  const { user } = useAuth();
  const [tiles, setTiles] = createSignal<Record<string, Tile>>({});
  let containerRef: HTMLDivElement | undefined;
  // Initialize viewport with (0,0) at top-left
  const getInitialViewport = (): Viewport => {
    const width = containerRef?.clientWidth || VIEWPORT_WIDTH;
    const height = containerRef?.clientHeight || VIEWPORT_HEIGHT;
    console.log(`width, height: ${width}, ${height}`)
    return {
      x: 0,  // Start exactly at (0,0)
      y: 0,
      zoom: 1.0,  // 100% zoom
      width,
      height
    };
  };

  const [viewport, setViewport] = createSignal<Viewport>(getInitialViewport());
  
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
  const [error, setError] = createSignal<string | null>(null);
  const [tileCacheState, setTileCache] = createSignal<Record<string, boolean>>({});
  const tileCache = new TileCache(); // Initialize tile cache at component level
  const [tileQueue, setTileQueue] = createSignal<Array<{x: number, y: number}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = createSignal(false);
  // Track active operations and state
  const activeOperations = new Set<AbortController>();
  let processQueueTimeout: number | null = null;
  let shouldStopProcessing = false;
  
  // Handle window resize to update viewport dimensions
  const handleResize = () => {
    if (containerRef) {
      const width = containerRef.clientWidth;
      const height = containerRef.clientHeight;
      setViewport(prev => ({
        ...prev,
        width,
        height
      }));
      // Reschedule tiles after a short delay to avoid excessive updates
      setTimeout(scheduleTilesForLoading, 100);
    }
  };

  // Track mount state and mount ID
  const [isMounted, setIsMounted] = createSignal(false);
  const currentMountId = Math.floor(Math.random() * 1000000);
  
  // Function to check if a tile is stale and needs refresh
  const isTileStale = (tile: Tile | undefined): boolean => {
    if (!tile) return true;
    if (tile.error) return true; // Always refresh errored tiles
    const tileAge = Date.now() - tile.timestamp;
    const isStale = tileAge > 20 * 1000; // 20 seconds threshold
    return isStale;
  };

  // Function to load all visible tiles
  const loadVisibleTiles = () => {
    if (!isMounted()) {
      return;
    }
    
    
    // Check for stale tiles that need refresh
    const currentTiles = tiles();
    let staleCount = 0;
    
    Object.values(currentTiles).forEach(tile => {
      if (isTileStale(tile)) {
        staleCount++;
        loadTile(tile.x, tile.y, true).catch(error => {
          console.error(`[loadVisibleTiles] Error refreshing tile (${tile.x}, ${tile.y}):`, error);
        });
      }
    });
    
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
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
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
      
      // Add center tile to ensure something loads immediately
      //const centerX = Math.floor((width / 2) / TILE_SIZE);
      //const centerY = Math.floor((height / 2) / TILE_SIZE);
      
      //scheduleTilesForLoading([{x: centerX, y: centerY}]);
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
    setViewport(prev => {
      const newViewport = {
        ...prev,
        ...updates
      };
      
      // Schedule tiles to update after viewport changes
      requestAnimationFrame(() => {
        scheduleTilesForLoading();
      });
      
      return newViewport;
    });
  };
  
  // Generate coordinates in a spiral pattern starting from (0,0)
  const generateSpiralCoords = (centerX: number, centerY: number, radius: number) => {
    const result: Array<{x: number, y: number, distance: number}> = [];
    
    result.push({ x: centerX, y: centerY, distance: 0 });
    
    for (let r = 1; r <= radius; r++) {
      // Start at the top-right corner of the square
      let x = r;
      let y = -r;
      
      // Top edge (right to left)
      for (; x >= -r; x--) {
        result.push({ x: centerX + x, y: centerY + y, distance: r });
      }
      x++;
      y++;
      
      // Left edge (top to bottom)
      for (; y <= r; y++) {
        result.push({ x: centerX + x, y: centerY + y, distance: r });
      }
      y--;
      x++;
      
      // Bottom edge (left to right)
      for (; x <= r; x++) {
        result.push({ x: centerX + x, y: centerY + y, distance: r });
      }
      x--;
      y--;
      
      // Right edge (bottom to top)
      for (; y > -r; y--) {
        result.push({ x: centerX + x, y: centerY + y, distance: r });
      }
    }
    
    return result;
  };
  
  // Schedule tiles for loading based on current viewport
  const scheduleTilesForLoading = (specificTiles?: Array<{x: number, y: number}>) => {
    // If specific tiles are provided, just process those
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
    
    // If queue is getting full, only add high priority tiles
    const isQueueAlmostFull = queueLength > TILE_LOAD_CONFIG.MAX_TILES_TO_LOAD * 0.8;
    
    if (isQueueAlmostFull) {
      console.log(`[scheduleTilesForLoading] Queue is almost full (${queueLength}/${TILE_LOAD_CONFIG.MAX_TILES_TO_LOAD}), only adding high priority tiles`);
    }
    
    const vp = viewport();
    const zoom = vp.zoom;
    
    // If queue is full, skip scheduling more tiles
    if (queueLength >= TILE_LOAD_CONFIG.MAX_TILES_TO_LOAD) {
      processTileQueue();
      return;
    }
    
    // Calculate visible area in world coordinates
    const centerX = vp.x + (vp.width / zoom) / 2;
    const centerY = vp.y + (vp.height / zoom) / 2;
    
    // Calculate how many tiles we need to cover the viewport
    const tilesX = Math.ceil((vp.width / zoom) / TILE_SIZE) + 1; // +1 for buffer tiles
    const tilesY = Math.ceil((vp.height / zoom) / TILE_SIZE) + 1; // +1 for buffer tiles
    const spiralRadius = Math.max(tilesX, tilesY);
    
    // Generate spiral coordinates starting from (0,0)
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
      
      // Calculate distance from (0,0) for priority
      //const distance = Math.sqrt(x * x + y * y);
      
      // Only add tiles that are within the visible area plus a small buffer
      if (distance <= spiralRadius * 1.2) {
        visibleTiles.push({
          x, y,
          priority: distance // Closer tiles have higher priority (lower number)
        });
      }
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
      
      
      // Sort tiles by distance from viewport center (closest first)
      const vp = viewport();
      const centerX = vp.width / 2;
      const centerY = vp.height / 2;
      
      const sortedQueue = [...currentQueue].sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2));
        const distB = Math.sqrt(Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2));
        return distA - distB;
      });
      
      // Process tiles in batches
      const batchSize = Math.min(TILE_LOAD_CONFIG.BATCH_SIZE, sortedQueue.length);
      const batch = sortedQueue.slice(0, batchSize);
      
      
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

  // Convert world coordinates to tile coordinates
  const worldToTileCoords = (x: number, y: number) => ({
    tileX: Math.floor(x / TILE_SIZE),
    tileY: Math.floor(y / TILE_SIZE)
  });

  // Convert tile coordinates to world coordinates
  const tileToWorldCoords = (tileX: number, tileY: number) => ({
    x: tileX * TILE_SIZE,
    y: tileY * TILE_SIZE
  });

  // Get tile key from coordinates
  const getTileKey = (tileX: number, tileY: number) => `${tileX},${tileY}`;

  // Load a single tile
  const loadTile = async (tileX: number, tileY: number, forceRefresh = false): Promise<void> => {
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
    const currentTiles = tiles();
    const currentTile = currentTiles[key];
    
    // Skip if already loading the same tile, unless we're forcing a refresh
    if (currentTile?.loading) {
      if (!forceRefresh) {
        return;
      } else {
        console.log(`[loadTile] Forcing refresh of already loading tile (${tileX}, ${tileY})`);
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
              timestamp: cachedTile.timestamp,
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
    
    // Mark as loading
    setTiles(prev => ({
      ...prev,
      [key]: {
        x: tileX,
        y: tileY,
        data: null,
        loading: true,
        error: false,
        timestamp: 0,
        mountId: currentMountId
      }
    }));

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
      
      if (typeof tileData.data === 'string') {
        try {
          // Convert comma-separated string to Uint8Array
          const numbers = tileData.data.split(',').map(Number);
          if (numbers.some(isNaN)) {
            throw new Error('Invalid number in tile data');
          }
          bytes = new Uint8Array(numbers);
          
          // Store the processed data in cache
          try {
            await tileCache.setTile(tileX, tileY, bytes);
          } catch (cacheError) {
            console.error(`[loadTile] Error caching tile (${tileX}, ${tileY}):`, cacheError);
          }
          
        } catch (error) {
          console.error('Error parsing tile data:', error);
          throw new Error('Failed to parse tile data');
        }
      } else if (Array.isArray(tileData.data)) {
        bytes = new Uint8Array(tileData.data);
        
        // Store the processed data in cache
        try {
          await tileCache.setTile(tileX, tileY, bytes);
        } catch (cacheError) {
          console.error(`[loadTile] Error caching tile (${tileX}, ${tileY}):`, cacheError);
        }
      } else {
        throw new Error('Unexpected tile data format');
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

  // Helper to check if a tile is visible in the viewport
  const isTileVisible = (tileX: number, tileY: number, vp: Viewport): boolean => {
    const tileWorldX = tileX * TILE_SIZE;
    const tileWorldY = tileY * TILE_SIZE;
    const tileEndWorldX = tileWorldX + TILE_SIZE;
    const tileEndWorldY = tileWorldY + TILE_SIZE;
    
    const viewEndX = vp.x + (vp.width / vp.zoom);
    const viewEndY = vp.y + (vp.height / vp.zoom);
    
    return !(
      tileEndWorldX < vp.x || 
      tileWorldX > viewEndX ||
      tileEndWorldY < vp.y ||
      tileWorldY > viewEndY
    );
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
      // Convert screen movement to world movement based on zoom
      const newX = vp.x - (dx / vp.zoom);
      const newY = vp.y - (dy / vp.zoom);
      
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
  });

  // Handle zooming with mouse wheel
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    // Calculate zoom factor (zoom in on scroll up, zoom out on scroll down)
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    
    // Get mouse position relative to the container
    const rect = containerRef?.getBoundingClientRect();
    if (!rect) return;
    console.log(`rect: ${rect.left}, ${rect.top}`)
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get current viewport values
    const currentVp = viewport();
    
    // Calculate the mouse position in world coordinates before zoom
    const worldX = currentVp.x + (mouseX / currentVp.zoom);
    const worldY = currentVp.y + (mouseY / currentVp.zoom);
    
    // Calculate new zoom level with constraints
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentVp.zoom * zoomFactor));
    
    // Calculate new position to keep the mouse point fixed during zoom
    const newX = worldX - (mouseX / newZoom);
    const newY = worldY - (mouseY / newZoom);
    
    console.log(`[MapView] handleWheel newX: ${newX}, newY: ${newY}, newZoom: ${newZoom}`)
    // Update viewport with new zoom and position in a single update
    updateViewport({
      x: newX,
      y: newY,
      zoom: newZoom,
      width: currentVp.width,
      height: currentVp.height
    });
  };
  
  
  // Update tiles when viewport changes with debounce
  createEffect(() => {
    const vp = viewport();
    
    // Debounce the tile loading to avoid too many updates during rapid viewport changes
    const debounceTimer = setTimeout(() => {
      scheduleTilesForLoading();
    }, 50);
    
    return () => clearTimeout(debounceTimer);
  });

  // Debug: Track last zoom to detect changes
  let lastZoom = viewport().zoom;
  
  // Generate a consistent color based on tile coordinates
  const getTileColor = (x: number, y: number): string => {
    const hue = (x * 13 + y * 7) % 360;
    return `hsl(${hue}, 70%, ${tiles()[`${x},${y}`]?.data ? '85%' : '90%'})`;
  };

  // Render a single tile
  const renderTile = (tile: Tile) => {
    const vp = viewport();
    const zoom = vp.zoom;
    
    // Log zoom changes
    if (zoom !== lastZoom) {
      lastZoom = zoom;
    }
    
    // Calculate tile position in world coordinates (1 unit = 1 pixel)
    // tile.x+t tile.y+t also change TAG-t
    const tileWorldX = (tile.x+6) * TILE_SIZE;
    const tileWorldY = (tile.y+6) * TILE_SIZE;
    
    // Calculate position relative to the viewport
    // Since the viewport is centered, we need to adjust the position
    const posX = Math.round(tileWorldX);
    const posY = Math.round(tileWorldY);
    
    // Use the calculated positions
    const pixelAlignedX = posX;
    const pixelAlignedY = posY;
    
    // Calculate tile bounds with exact size (no overlap)
    const tileEndWorldX = tileWorldX + TILE_SIZE;
    const tileEndWorldY = tileWorldY + TILE_SIZE;
    
    // Initialize content with a default empty div
    let content: JSX.Element = <div></div>;
    
    if (tile.error) {
      // Error state
      content = (
        <div class={`${styles.fallbackTile} ${styles.error}`}>
          <div class={styles.fallbackTileContent}>
            Error
            <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
          </div>
        </div>
      );
    } else if (tile.loading) {
      // Loading state with animation
      content = (
        <div 
          class={`${styles.fallbackTile} loading`}
          style={`--tile-bg-color: ${getTileColor(tile.x, tile.y)}`}
        >
          <div class={styles.fallbackTileContent}>
            <div class={styles.loadingSpinner} />
            <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
          </div>
        </div>
      );
    } else if (!tile.data || tile.data.length === 0) {
      // Empty tile state
      content = (
        <div 
          class={styles.fallbackTile}
          style={`--tile-bg-color: ${getTileColor(tile.x, tile.y)}`}
        >
          <div class={styles.fallbackTileContent}>
            <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
          </div>
        </div>
      );
    } else {
      try {
        // Try to render the tile image
        const tileImage = renderBitmap(tile.data);
        
        if (tileImage) {
          // Successfully rendered tile
          content = (
            <div class={styles.tileContent}>
              <img
                src={tileImage}
                alt={`Tile ${tile.x},${tile.y}`}
                class={styles.tileImage}
                loading="lazy"
              />
              <div class={styles.tileLabel}>
                {tile.x},{tile.y}
              </div>
            </div>
          );
        } else {
          // Fallback to colored tile if image couldn't be generated
          content = (
            <div 
              class={styles.fallbackTile}
              style={`--tile-bg-color: ${getTileColor(tile.x, tile.y)}`}
            >
              <div class={styles.fallbackTileContent}>
                <div class={styles.tileCoords}>{tile.x},{tile.y}</div>
              </div>
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
          '--tile-scale': zoom.toString(),
          '--tile-size': `${TILE_SIZE / zoom}px`,
          '--tile-base-size': `${TILE_SIZE}px`
        }}
        data-tile-x={tile.x}
        data-tile-y={tile.y}
        data-world-x={tileWorldX}
        data-world-y={tileWorldY}
        data-pos-x={pixelAlignedX}
        data-pos-y={pixelAlignedY}
        data-zoom={zoom}
      >
        {content}
      </div>
    );
  };

  // Convert tile data to an image data URL
  const renderBitmap = (tileData: Uint8Array | string): string => {
    // Skip in SSR
    if (typeof document === 'undefined') return '';
    
    // If tileData is already a data URL, return it directly
    if (typeof tileData === 'string' && tileData.startsWith('data:image/')) {
      return tileData;
    }
    
    try {
      // The tile data should already be a Uint8Array at this point
      const data = tileData as Uint8Array;
      
      // Check for empty data
      if (!data || data.length === 0) {
        console.log('Empty tile data');
        return '';
      }

      // The first byte is a version byte (0x01 for our format)
      if (data[0] === 0x01) {
        try {
          // Skip the first byte (version) and decompress the rest
          const compressedData = (data as Uint8Array).subarray(1);
          const decompressed = inflate(compressedData);
          
          // The decompressed data should be a 1-bit bitmap (1 bit per pixel)
          const expectedSize = Math.ceil((TILE_SIZE * TILE_SIZE) / 8);
          if (decompressed.length !== expectedSize) {
            console.warn(`Unexpected decompressed size: ${decompressed.length}, expected ${expectedSize}`);
          }
          
          // Convert 1-bit bitmap to RGBA
          const imageData = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
          let pixelIndex = 0;
          
          for (let i = 0; i < decompressed.length && pixelIndex < TILE_SIZE * TILE_SIZE; i++) {
            const byte = decompressed[i];
            
            // Process each bit in the byte (MSB first)
            for (let bit = 7; bit >= 0 && pixelIndex < TILE_SIZE * TILE_SIZE; bit--, pixelIndex++) {
              const bitValue = (byte >> bit) & 1;
              const pixelOffset = pixelIndex * 4;
              
              // Set RGBA values based on the bit value
              if (bitValue) {
                // Black pixel
                imageData[pixelOffset] = 0;     // R
                imageData[pixelOffset + 1] = 0; // G
                imageData[pixelOffset + 2] = 0; // B
                imageData[pixelOffset + 3] = 255; // A (fully opaque)
              } else {
                // White pixel (transparent)
                imageData[pixelOffset] = 255;     // R
                imageData[pixelOffset + 1] = 255; // G
                imageData[pixelOffset + 2] = 255; // B
                imageData[pixelOffset + 3] = 0;   // A (fully transparent)
              }
            }
          }
          
          return renderImageData(imageData);
          
        } catch (error) {
          console.error('Failed to process compressed tile data:', error);
          return '';
        }
      } else {
        console.log('Unsupported data format or missing version byte');
        return '';
      }

    } catch (error) {
      console.error('Error rendering bitmap:', error);
      return '';
    }
  };
  
  // Helper function to convert ImageData to a data URL
  const renderImageData = (imageData: Uint8ClampedArray): string => {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    // Create ImageData and draw it
    const imgData = new ImageData(imageData, TILE_SIZE, TILE_SIZE);
    ctx.putImageData(imgData, 0, 0);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  };

  return (
    <div
      class={styles.mapContainer}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <div class={isDragging() ? styles.mapViewportDragging : styles.mapViewport}>
        <div 
          class={styles.mapContent}
          style={{
            '--translate-x': '0px',
            '--translate-y': '0px',
            '--scale': viewport().zoom,
            // t*64 (also change TAG-t
            'transform': `scale(${viewport().zoom}) translate(${-viewport().x - (6 * 64)}px, ${-viewport().y - (6 * 64)}px)`
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
            {Object.values(tiles()).map(tile => renderTile(tile))}
          </div>
        </div>
      </div>
      
      {isLoading() && (
        <div class={styles.loadingOverlay}>
          Loading map...
        </div>
      )}
      
      {error() && (
        <div class={styles.errorOverlay}>
          {error()}
        </div>
      )}
      
      <div class={styles.controls}>
        <div class={styles.zoomControls}>
          <button 
            onClick={() => {
              const vp = viewport();
              const newZoom = Math.min(MAX_ZOOM, vp.zoom * 1.2);
              // Calculate the new position to keep (0,0) fixed
              const dx = (vp.width / 2) * (1 - newZoom / vp.zoom);
              const dy = (vp.height / 2) * (1 - newZoom / vp.zoom);
              console.log(`[MapView] handleZoomIn newX: ${vp.x - dx}, newY: ${vp.y - dy}, newZoom: ${newZoom}`)
              updateViewport({
                zoom: newZoom,
                x: vp.x - dx,
                y: vp.y - dy
              });
            }}
            disabled={viewport().zoom >= MAX_ZOOM}
          >
            +
          </button>
          <button 
            onClick={() => {
              const vp = viewport();
              const newZoom = Math.max(MIN_ZOOM, vp.zoom / 1.2);
              // Calculate the new position to keep (0,0) fixed
              const dx = (vp.width / 2) * (1 - newZoom / vp.zoom);
              const dy = (vp.height / 2) * (1 - newZoom / vp.zoom);
              console.log(`[MapView] handleZoomOut newX: ${vp.x - dx}, newY: ${vp.y - dy}, newZoom: ${newZoom}`)
              updateViewport({
                zoom: newZoom,
                x: vp.x - dx,
                y: vp.y - dy
              });
            }}
            disabled={viewport().zoom <= MIN_ZOOM}
          >
            -
          </button>
        </div>
        <div class={styles.coordinates}>
          Position: {Math.round(viewport().x)}, {Math.round(viewport().y)}
          <br />
          Zoom: {Math.round(viewport().zoom * 100)}%
          <br />
          Tiles: {Object.keys(tiles()).length}
        </div>
      </div>
    </div>
  );
};

export default MapView;
