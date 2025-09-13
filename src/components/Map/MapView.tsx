import { Component, createEffect, createSignal, onCleanup, onMount, batch } from 'solid-js';
import { inflate } from 'pako';
import { useAuth } from '../../contexts/auth';
import { TileCache } from '../../lib/client/services/tile-cache';
import { getAffectedTiles } from '../../lib/server/utils/coordinate-utils';

// Initialize the tile cache
const tileCache = new TileCache();
import styles from './MapView.module.css';

// Constants
const TILE_SIZE = 64; // pixels

// Tile loading configuration
const TILE_LOAD_CONFIG = {
  BATCH_SIZE: 2,                  // Reduced to load fewer tiles at once
  SCREEN_BUFFER: 1,               // Number of screens to preload around the viewport
  MAX_TILES_TO_LOAD: 50,          // Reduced maximum queue size
  BATCH_DELAY: 50                 // Slightly increased delay between batches
};

const VIEWPORT_WIDTH = 800; // pixels
const VIEWPORT_HEIGHT = 600; // pixels
const TILES_X = Math.ceil(VIEWPORT_WIDTH / TILE_SIZE) + 2; // +2 for buffer tiles
const TILES_Y = Math.ceil(VIEWPORT_HEIGHT / TILE_SIZE) + 2; // +2 for buffer tiles
const MIN_ZOOM = 0.5; // 50% zoom
const MAX_ZOOM = 4.0;  // 400% zoom
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
  const [tileQueue, setTileQueue] = createSignal<Array<{x: number, y: number}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = createSignal(false);
  // Track active operations and state
  const activeOperations = new Set<AbortController>();
  const [mountId, setMountId] = createSignal(0);
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

  // Initialize tile loading when component mounts
  onMount(() => {
    console.log('[MapView] Component mounted, scheduling initial tile load');
    
    // Set up resize observer
    if (containerRef) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef);
      
      // Clean up on unmount
      onCleanup(() => {
        resizeObserver.disconnect();
      });
    }
    
    // Schedule initial tile loading after a short delay to ensure the component is fully rendered
    console.log('[MapView] Scheduling initial tile load');
    const initialLoad = () => {
      console.log('[MapView] Running initial scheduleTilesForLoading');
      // Update viewport with initial dimensions
      const width = containerRef?.clientWidth || VIEWPORT_WIDTH;
      const height = containerRef?.clientHeight || VIEWPORT_HEIGHT;
      
      console.log(`[MapView] Initial viewport dimensions: ${width}x${height}`);
      
      setViewport(prev => ({
        ...prev,
        width,
        height
      }));
      
      // Force add center tile to the queue to ensure something loads
      const centerX = Math.floor((width / 2) / TILE_SIZE);
      const centerY = Math.floor((height / 2) / TILE_SIZE);
      
      console.log(`[MapView] Adding center tile (${centerX}, ${centerY}) to queue`);
      scheduleTilesForLoading([{x: centerX, y: centerY}]);
    };
    
    // Use requestAnimationFrame to ensure the DOM is ready
    requestAnimationFrame(() => {
      setTimeout(initialLoad, 50);
    });
  });

  // Update viewport and schedule tiles for loading
  const updateViewport = (updates: Partial<Viewport>) => {
    console.log('[updateViewport] Updating viewport with:', JSON.stringify(updates, null, 2));
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
    
    // Start from (0,0)
    result.push({ x: 0, y: 0, distance: 0 });
    
    // Generate spiral coordinates starting from (0,0)
    for (let r = 1; r <= radius; r++) {
      // Start at the top-right corner of the square
      let x = r;
      let y = -r;
      
      // Top edge (right to left)
      for (; x >= -r; x--) {
        result.push({ x, y, distance: r });
      }
      x++;
      y++;
      
      // Left edge (top to bottom)
      for (; y <= r; y++) {
        result.push({ x, y, distance: r });
      }
      y--;
      x++;
      
      // Bottom edge (left to right)
      for (; x <= r; x++) {
        result.push({ x, y, distance: r });
      }
      x--;
      y--;
      
      // Right edge (bottom to top)
      for (; y > -r; y--) {
        result.push({ x, y, distance: r });
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
    if (shouldStopProcessing || mountId() === 0) return;
    
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
      console.log(`[scheduleTilesForLoading] Queue full (${queueLength}), processing existing queue`);
      processTileQueue();
      return;
    }
    
    // Calculate visible area in world coordinates
    const centerX = vp.x + (vp.width / zoom) / 2;
    const centerY = vp.y + (vp.height / zoom) / 2;
    
    // Calculate how many tiles we need to cover the viewport
    const tilesX = Math.ceil((vp.width / zoom) / TILE_SIZE) + 2; // +2 for buffer tiles
    const tilesY = Math.ceil((vp.height / zoom) / TILE_SIZE) + 2; // +2 for buffer tiles
    const spiralRadius = Math.max(tilesX, tilesY);
    
    console.log(`[scheduleTilesForLoading] Starting spiral from (0,0) with radius: ${spiralRadius}`);
    
    // Generate spiral coordinates starting from (0,0)
    const spiralCoords = generateSpiralCoords(0, 0, spiralRadius);
    
    // Filter and prioritize tiles
    const visibleTiles: Array<{x: number, y: number, priority: number}> = [];
    const queueSet = new Set(currentQueue.map(t => `${t.x},${t.y}`));
    
    for (const {x, y} of spiralCoords) {
      const key = `${x},${y}`;
      const existingTile = tiles()[key];
      
      // Skip if already loaded or loading
      if (existingTile?.data || existingTile?.loading) continue;
      
      // Skip if already in queue
      if (queueSet.has(key)) continue;
      
      // Calculate distance from (0,0) for priority
      const distance = Math.sqrt(x * x + y * y);
      
      // Only add tiles that are within the visible area plus a small buffer
      if (distance <= spiralRadius * 1.5) {
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
      console.log(`[scheduleTilesForLoading] Adding ${tilesToLoad.length} tiles to queue`);
      
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
        console.log('[scheduleTilesForLoading] Starting queue processing');
        setTimeout(processTileQueue, 0);
      }
    }
  };

  // Cleanup on unmount
  onCleanup(() => {
    console.log('[MapView] Cleaning up...');
    shouldStopProcessing = true;
    setMountId(prev => prev + 1);
    
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
    const currentMountId = mountId();
    if (currentMountId === 0) throw new Error('Component is not mounted');
    
    const controller = new AbortController();
    activeOperations.add(controller);
    
    return {
      signal: controller.signal,
      cleanup: () => activeOperations.delete(controller)
    };
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
  const loadTile = async (tileX: number, tileY: number) => {
    const currentMountId = mountId();
    
    const key = getTileKey(tileX, tileY);
    const currentTiles = tiles();
    
    console.log(`[loadTile] Attempting to load tile (${tileX}, ${tileY})`);
    
    // Skip if already loading
    if (currentTiles[key]?.loading) {
      console.log(`[loadTile] Tile (${tileX}, ${tileY}) is already loading`);
      return;
    }
    
    // Check if we need to load fresh data
    const currentTile = currentTiles[key];
    if (currentTile?.data) {
      // If tile was loaded in a previous mount or is stale, reload it
      const isStale = Date.now() - currentTile.timestamp >= 30000;
      const isFromPreviousMount = currentTile.mountId !== currentMountId;
      
      if (!isStale && !isFromPreviousMount) {
        console.log(`[loadTile] Tile (${tileX}, ${tileY}) is up to date`);
        return;
      }
      
      console.log(`[loadTile] Tile (${tileX}, ${tileY}) needs refresh:`, 
        { isStale, isFromPreviousMount });
    }
    
    const { signal, cleanup } = createCancellableOperation();

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

    try {
      // Always fetch from server first
      console.log(`[loadTile] Fetching tile (${tileX}, ${tileY}) from server`);
      if (mountId() !== currentMountId) {
        console.log(`[loadTile] Component remounted, aborting fetch for tile (${tileX}, ${tileY})`);
        return null;
      }
      
      const response = await fetch(`/api/map/tile/${tileX}/${tileY}`, { 
        signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load tile (${tileX}, ${tileY}): ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(`[loadTile] Response for tile (${tileX}, ${tileY}):`, {
        success: responseData.success,
        data: {
          ...responseData.data,
          data: typeof responseData.data?.data === 'string' 
            ? `${responseData.data.data.substring(0, 30)}...` 
            : responseData.data?.data
        },
        requestId: responseData.requestId
      });
      
      if (!responseData.success || !responseData.data) {
        console.error(`[loadTile] Invalid response format for tile (${tileX}, ${tileY}):`, responseData);
        throw new Error(`Invalid response format for tile (${tileX}, ${tileY})`);
      }
      
      // The API returns the tile data in responseData.data
      const tileData = responseData.data;
      
      // Convert the data to a Uint8Array based on its type
      let bytes;
      
      if (Array.isArray(tileData.data)) {
        // If it's already an array of numbers, convert directly to Uint8Array
        bytes = new Uint8Array(tileData.data);
      } else if (typeof tileData.data === 'string') {
        // Handle comma-separated string of numbers
        try {
          const numbers = tileData.data.split(',').map(Number);
          if (numbers.some(isNaN)) {
            throw new Error('Invalid number in tile data');
          }
          bytes = new Uint8Array(numbers);
        } catch (error) {
          console.error('Error parsing tile data:', error);
          throw new Error('Failed to parse tile data');
        }
      } else {
        throw new Error('Unexpected tile data format');
      }
      
      console.log(`[loadTile] Successfully processed tile (${tileX}, ${tileY}), data length:`, bytes.length);

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
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;
      
      console.error(`Error loading tile (${tileX}, ${tileY}):`, err);
      if (mountId() === currentMountId) {
        setTiles(prev => ({
          ...prev,
          [key]: {
            ...(prev[key] || { x: tileX, y: tileY }),
            loading: false,
            error: true,
            timestamp: Date.now()
          }
        }));
      }
    } finally {
      cleanup();
    }
  };

  // Process the tile loading queue with priority to visible tiles
  const processTileQueue = async () => {
    if (shouldStopProcessing || mountId() === 0 || activeOperations.size > 0) {
      console.log('[processTileQueue] Skipping - cleanup in progress or operations in progress');
      return;
    }
    
    const { signal, cleanup } = createCancellableOperation();
    
    if (isProcessingQueue()) {
      return;
    }
    
    const currentQueue = tileQueue();
    if (currentQueue.length === 0) {
      return;
    }
    
    console.log(`[processTileQueue] Starting, queue length: ${currentQueue.length}`);
    
    setIsProcessingQueue(true);
    // Create a copy of the queue to work with and clear the main queue
    const queue = [...currentQueue];
    const processedTiles = new Set<string>();
    setTileQueue([]); // Clear the queue immediately to prevent duplicates
    
    try {
      const vp = viewport();
      // Sort tiles by distance to viewport center (prioritize loading visible tiles first)
      const centerX = vp.x + (vp.width / 2) / vp.zoom;
      const centerY = vp.y + (vp.height / 2) / vp.zoom;
      
      queue.sort((a, b) => {
        const distA = Math.hypot(a.x * TILE_SIZE + TILE_SIZE/2 - centerX, a.y * TILE_SIZE + TILE_SIZE/2 - centerY);
        const distB = Math.hypot(b.x * TILE_SIZE + TILE_SIZE/2 - centerX, b.y * TILE_SIZE + TILE_SIZE/2 - centerY);
        return distA - distB;
      });
      
            // Process tiles in batches to avoid UI freezing
      console.log(`[processTileQueue] Processing ${queue.length} tiles in batches of ${TILE_LOAD_CONFIG.BATCH_SIZE}`);
      
      // Process all batches
      for (let i = 0; i < queue.length && !shouldStopProcessing; i += TILE_LOAD_CONFIG.BATCH_SIZE) {
        if (shouldStopProcessing) break;
        
        const batch = queue.slice(i, i + TILE_LOAD_CONFIG.BATCH_SIZE);
        console.log(`[processTileQueue] Processing batch of ${batch.length} tiles`);
        
        try {
          // Mark these tiles as processed
          batch.forEach(({x, y}) => processedTiles.add(`${x},${y}`));
          
          // Load all tiles in parallel
          await Promise.all(batch.map(({x, y}) => {
            if (shouldStopProcessing) return Promise.resolve();
            console.log(`[processTileQueue] Loading tile (${x}, ${y})`);
            return loadTile(x, y);
          }));
          
          // Add a small delay between batches to keep the UI responsive
          if (i + TILE_LOAD_CONFIG.BATCH_SIZE < queue.length && !shouldStopProcessing) {
            await new Promise(resolve => {
              if (shouldStopProcessing) return resolve(undefined);
              const timeoutId = setTimeout(resolve, TILE_LOAD_CONFIG.BATCH_DELAY);
              // Store timeout ID for cleanup
              processQueueTimeout = timeoutId as unknown as number;
            });
          }
        } catch (err) {
          if (!shouldStopProcessing) {
            console.error('Error in batch processing:', err);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error processing tile queue:', err);
      setError('Error loading map data');
    } finally {
      cleanup();
      setIsProcessingQueue(false);
      
      // Check if we have more tiles to process
      if (mountId() > 0) {
        const remainingTiles = tileQueue();
        if (remainingTiles.length > 0) {
          console.log(`[processTileQueue] Processing remaining ${remainingTiles.length} tiles`);
          // Use requestAnimationFrame for better scheduling
          requestAnimationFrame(() => {
            processQueueTimeout = window.setTimeout(processTileQueue, 0);
          });
        } else {
          console.log('[processTileQueue] Queue is empty, all tiles processed');
        }
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

  // Load initial tiles
  onMount(() => {
    console.log('[MapView] Component mounted, scheduling initial tile load');
    scheduleTilesForLoading();
    
    // Clean up event listeners
    onCleanup(() => {
      document.body.style.cursor = '';
    });
  });

  // Handle zooming with mouse wheel
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    // Calculate zoom factor (zoom in on scroll up, zoom out on scroll down)
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    
    // Get mouse position relative to the container
    const rect = containerRef?.getBoundingClientRect();
    if (!rect) return;
    
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
    
    // Update viewport with new zoom and position in a single update
    updateViewport({
      x: newX,
      y: newY,
      zoom: newZoom,
      width: currentVp.width,
      height: currentVp.height
    });
  };
  
  // Initialize and clean up
  onMount(() => {
    // Schedule initial tile loading
    scheduleTilesForLoading();
    
    // Clean up
    onCleanup(() => {
      document.body.style.cursor = '';
      // Don't clear the IndexedDB cache, just the in-memory state
      setTiles({});
      setTileQueue([]);
      setTileCache({});
    });
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

  // Debug: Track last zoom to detect changes
  let lastZoom = viewport().zoom;
  
  // Render a single tile
  const renderTile = (tile: Tile) => {
    const vp = viewport();
    const zoom = vp.zoom;
    
    // Log zoom changes
    if (zoom !== lastZoom) {
      console.log(`Zoom changed from ${lastZoom} to ${zoom}`);
      lastZoom = zoom;
    }
    
    // Calculate tile position in world coordinates (1 unit = 1 pixel)
    const tileWorldX = tile.x * TILE_SIZE;
    const tileWorldY = tile.y * TILE_SIZE;
    
    // Calculate position relative to the viewport
    // Since the viewport is centered, we need to adjust the position
    const posX = Math.round(tileWorldX);
    const posY = Math.round(tileWorldY);
    
    // Use the calculated positions
    const pixelAlignedX = posX;
    const pixelAlignedY = posY;
    
    // Debug logging for (0,0) tile
    if (tile.x === 0 && tile.y === 0) {
      console.log('(0,0) Tile Position:', { 
        posX, 
        posY,
        viewportX: vp.x, 
        viewportY: vp.y, 
        zoom
      });
    }

    // Calculate tile bounds with exact size (no overlap)
    const tileEndWorldX = tileWorldX + TILE_SIZE;
    const tileEndWorldY = tileWorldY + TILE_SIZE;
    
    // Calculate viewport bounds in world coordinates (matching grid rendering)
    const viewEndX = vp.x + (vp.width / zoom);
    const viewEndY = vp.y + (vp.height / zoom);
    
    // Skip rendering if tile is outside viewport with some padding
    const padding = TILE_SIZE * 2;
    if (
      tileWorldX > viewEndX + padding ||
      tileWorldX + TILE_SIZE < vp.x - padding ||
      tileWorldY > viewEndY + padding ||
      tileWorldY + TILE_SIZE < vp.y - padding
    ) {
      return null;
    }

    // Calculate tile size after zoom (handled by the container's transform)
    const tileSize = TILE_SIZE;
    let content;
    
    if (tile.loading) {
      content = <div class={styles.loading}>Loading...</div>;
    } else if (tile.error) {
      content = <div class={styles.error}>Error</div>;
    } else if (tile.data) {
      try {
        const tileImage = renderBitmap(tile.data);
        if (tileImage) {
          content = (
            <div class={styles.tileContent}>
              <img
                src={tileImage}
                alt={`Tile ${tile.x},${tile.y}`}
                class={styles.tileImage}
              />
              <div class={styles.tileLabel}>
                {tile.x},{tile.y}
              </div>
            </div>
          );
        } else {
          // Fallback to debug rendering if image couldn't be generated
          content = (
            <div 
              class={styles.fallbackTile}
              style={`--tile-bg-color: hsl(${(tile.x * 13 + tile.y * 7) % 360}, 70%, 80%)`}
            >
              <div class={styles.fallbackTileContent}>
                {tile.x},{tile.y}
              </div>
            </div>
          );
        }
      } catch (error) {
        console.error('Error rendering tile:', error);
        content = <div class={styles.error}>Error</div>;
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
      
      console.log('Processing tile data:', { 
        type: typeof tileData, 
        length: data.length,
        firstBytes: Array.from(data as Uint8Array).slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join(' ')
      });
      
      // Check for empty data
      if (!data || data.length === 0) {
        console.log('Empty tile data');
        return '';
      }

      // The first byte is a version byte (0x01 for our format)
      if (data[0] === 0x01) {
        try {
          console.log('Processing zlib-compressed data with version byte');
          // Skip the first byte (version) and decompress the rest
          const compressedData = (data as Uint8Array).subarray(1);
          console.log('Decompressing data, compressed size:', compressedData.length);
          const decompressed = inflate(compressedData);
          console.log('Decompressed data length:', decompressed.length);
          
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
    
    // Don't draw grid lines on individual tiles - they're handled by the grid overlay
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    console.log('Generated image data URL');
    return dataUrl;
  };

  // Grid rendering with CSS modules
  const renderGrid = () => {
    const vp = viewport();
    const gridSize = 20;
    const width = vp.width / vp.zoom;
    const height = vp.height / vp.zoom;
    
    // Create grid lines
    const gridLines = [
      // Viewport border
      <rect 
        x={vp.x} 
        y={vp.y} 
        width={width} 
        height={height} 
        fill="none" 
        class={styles.gridAxis}
      />,
      // Vertical lines
      ...Array.from({length: Math.ceil(width / gridSize) + 1}).map((_, i) => {
        const x = vp.x + (i * gridSize);
        const isAxis = x === 0;
        const isMajor = x % 100 === 0;
        return (
          <line 
            x1={x} 
            y1={vp.y} 
            x2={x} 
            y2={vp.y + height} 
            class={`${styles.gridLine} ${isAxis ? styles.gridAxis : isMajor ? styles.gridMajor : styles.gridMinor}`}
          />
        );
      }),
      // Horizontal lines
      ...Array.from({length: Math.ceil(height / gridSize) + 1}).map((_, i) => {
        const y = vp.y + (i * gridSize);
        const isAxis = y === 0;
        const isMajor = y % 100 === 0;
        return (
          <line 
            x1={vp.x} 
            y1={y} 
            x2={vp.x + width} 
            y2={y} 
            class={`${styles.gridLine} ${isAxis ? styles.gridAxis : isMajor ? styles.gridMajor : styles.gridMinor}`}
          />
        );
      })
    ];

    return (
      <div class={styles.testGridContainer}>
        <svg 
          class={styles.gridSvg}
          viewBox={`${vp.x} ${vp.y} ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {gridLines}
          <text 
            x={vp.x + 10} 
            y={vp.y + 20} 
            class={styles.gridText}
          >
            Viewport: {vp.x.toFixed(0)},{vp.y.toFixed(0)} to {(vp.x + width).toFixed(0)},{(vp.y + height).toFixed(0)}
          </text>
        </svg>
      </div>
    );
  };

  const renderTestGrid = () => {
    const vp = viewport();
    const gridStyle = {
      backgroundPosition: `${-vp.x * vp.zoom}px ${-vp.y * vp.zoom}px`,
      transform: `scale(${vp.zoom})`,
      backgroundSize: `50px 50px`
    };
    
    return (
      <div class={styles.testGrid} style={gridStyle}>
        <div class={styles.testGridLabel}>
          Grid Test - You should see grid lines
        </div>
      </div>
    );
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
            'transform': `scale(${viewport().zoom}) translate(${-viewport().x}px, ${-viewport().y}px)`
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            'z-index': 1
          }}>
            {renderGrid()}
          </div>
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
