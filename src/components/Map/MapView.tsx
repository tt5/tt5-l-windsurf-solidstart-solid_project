import { Component, createEffect, createSignal, onCleanup, onMount, batch } from 'solid-js';
import { useAuth } from '../../contexts/auth';
import { TileCache } from '../../lib/client/services/tile-cache';

// Initialize the tile cache
const tileCache = new TileCache();
import styles from './MapView.module.css';

// Constants
const TILE_SIZE = 64; // pixels
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
  // Initialize viewport to show world coordinates from -1000 to 1000
  const WORLD_SIZE = 2000; // -1000 to 1000
  const initialZoom = Math.min(
    VIEWPORT_WIDTH / WORLD_SIZE,
    VIEWPORT_HEIGHT / WORLD_SIZE
  ) * 0.9; // 90% of the maximum zoom to add some padding
  
  const [viewport, setViewport] = createSignal<Viewport>({ 
    x: -WORLD_SIZE / 2,  // Center on x=0
    y: -WORLD_SIZE / 2,  // Center on y=0
    zoom: initialZoom,    // Zoom to fit the world
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT
  });
  
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
  let isMounted = true;
  let processQueueTimeout: number | null = null;
  let shouldStopProcessing = false;
  
  // Cleanup on unmount
  onCleanup(() => {
    console.log('[MapView] Cleaning up...');
    isMounted = false;
    shouldStopProcessing = true;
    
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
    if (!isMounted) throw new Error('Component is not mounted');
    
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
    if (!isMounted) return null;
    
    const { signal, cleanup } = createCancellableOperation();
    
    const key = getTileKey(tileX, tileY);
    const currentTiles = tiles();
    
    console.log(`[loadTile] Attempting to load tile (${tileX}, ${tileY})`);
    
    // Skip if already loading or loaded recently
    if (currentTiles[key]?.loading) {
      console.log(`[loadTile] Tile (${tileX}, ${tileY}) is already loading`);
      return;
    }
    
    if (currentTiles[key] && Date.now() - currentTiles[key].timestamp < 30000) {
      console.log(`[loadTile] Tile (${tileX}, ${tileY}) was loaded recently`);
      return;
    }

    // Mark as loading
    setTiles(prev => ({
      ...prev,
      [key]: {
        x: tileX,
        y: tileY,
        data: null,
        loading: true,
        error: false,
        timestamp: 0
      }
    }));

    try {
      // Try to get the tile from cache first
      const cachedTile = await tileCache.getTile(tileX, tileY);
      
      if (cachedTile) {
        // Use cached tile
        setTiles(prev => ({
          ...prev,
          [key]: {
            x: tileX,
            y: tileY,
            data: cachedTile.data,
            loading: false,
            error: false,
            timestamp: cachedTile.timestamp,
            fromCache: true
          }
        }));
        return;
      }
      
      // If not in cache, fetch from server
      console.log(`[loadTile] Fetching tile (${tileX}, ${tileY}) from server`);
      if (!isMounted) {
        console.log(`[loadTile] Component unmounted, aborting fetch for tile (${tileX}, ${tileY})`);
        return null;
      }
      
      const response = await fetch(`/api/map/tile/${tileX}/${tileY}`, { signal });
      if (!response.ok) {
        throw new Error(`Failed to load tile (${tileX}, ${tileY}): ${response.statusText}`);
      }

      const responseData = await response.json();
      const etag = response.headers.get('ETag') || undefined;
      
      // Convert base64 data back to Uint8Array
      const binaryString = atob(responseData.data.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Cache the tile
      try {
        await tileCache.setTile(tileX, tileY, bytes, etag);
      } catch (cacheError) {
        console.error('Error caching tile:', cacheError);
        // Continue even if caching fails
      }

      setTiles(prev => ({
        ...prev,
        [key]: {
          x: tileX,
          y: tileY,
          data: bytes,
          loading: false,
          error: false,
          timestamp: Date.now(),
          fromCache: false
        }
      }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;
      
      console.error(`Error loading tile (${tileX}, ${tileY}):`, err);
      if (isMounted) {
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
    if (shouldStopProcessing || !isMounted || activeOperations.size > 0) {
      console.log('[processTileQueue] Skipping - cleanup in progress or operations in progress');
      return;
    }
    
    const { signal, cleanup } = createCancellableOperation();
    
    const currentQueue = tileQueue();
    if (isProcessingQueue() || currentQueue.length === 0) {
      return;
    }
    
    console.log(`[processTileQueue] Starting, queue length: ${currentQueue.length}`);
    
    setIsProcessingQueue(true);
    const queue = [...tileQueue()];
    setTileQueue([]);
    
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
      const BATCH_SIZE = 4;
      console.log(`[processTileQueue] Processing ${queue.length} tiles in batches of ${BATCH_SIZE}`);
      for (let i = 0; i < queue.length && !shouldStopProcessing; i += BATCH_SIZE) {
        if (shouldStopProcessing) break;
        
        const batch = queue.slice(i, i + BATCH_SIZE);
        console.log(`[processTileQueue] Processing batch:`, batch);
        
        try {
          await Promise.all(batch.map(({x, y}) => shouldStopProcessing ? Promise.resolve() : loadTile(x, y)));
          
          // Small delay between batches to keep the UI responsive
          if (i + BATCH_SIZE < queue.length && !shouldStopProcessing) {
            await new Promise(resolve => {
              if (shouldStopProcessing) return resolve(undefined);
              const timeoutId = setTimeout(resolve, 50);
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
      
      // If new tiles were added while processing and we're still mounted, process them
      if (isMounted && tileQueue().length > 0) {
        processQueueTimeout = window.setTimeout(processTileQueue, 0);
      }
    }
  };
  
  // Effect to process tile queue when it changes
  createEffect(() => {
    if (tileQueue().length > 0 && isMounted) {
      const id = window.setTimeout(() => {
        if (isMounted) {
          processTileQueue();
        }
      }, 0);
      
      return () => clearTimeout(id);
    }
  });

  // Schedule tiles for loading based on viewport with priority levels
  const scheduleTilesForLoading = () => {
    console.log('[scheduleTilesForLoading] Scheduling tiles for loading');
    const vp = viewport();
    const zoom = vp.zoom;
    
    // Calculate visible area in world coordinates
    const startX = vp.x;
    const startY = vp.y;
    const endX = startX + vp.width / zoom;
    const endY = startY + vp.height / zoom;
    
    console.log(`[scheduleTilesForLoading] Viewport: x=${vp.x.toFixed(2)}, y=${vp.y.toFixed(2)}, zoom=${zoom.toFixed(2)}`);
    console.log(`[scheduleTilesForLoading] World bounds: (${startX.toFixed(2)}, ${startY.toFixed(2)}) to (${endX.toFixed(2)}, ${endY.toFixed(2)})`);
    
    // Get tile coordinates for visible area
    const startTile = worldToTileCoords(startX, startY);
    const endTile = worldToTileCoords(endX, endY);
    
    // Define priority areas (inner viewport has higher priority)
    const priorityAreas = [
      { padding: 0, priority: 1 },    // Highest priority: visible viewport
      { padding: 1, priority: 2 },    // Medium priority: one tile outside viewport
      { padding: 2, priority: 3 }     // Low priority: two tiles outside viewport
    ];
    
    const tilesToLoad: Array<{x: number, y: number, priority: number}> = [];
    const currentTiles = tiles();
    
    // Process each priority level
    for (const area of priorityAreas) {
      const { padding, priority } = area;
      
      // Calculate the area for this priority level
      const areaStartX = startTile.tileX - padding;
      const areaStartY = startTile.tileY - padding;
      const areaEndX = endTile.tileX + padding;
      const areaEndY = endTile.tileY + padding;
      
      // Add tiles in this area
      for (let y = areaStartY; y <= areaEndY; y++) {
        for (let x = areaStartX; x <= areaEndX; x++) {
          const key = getTileKey(x, y);
          const isAlreadyLoaded = currentTiles[key] && !currentTiles[key].loading && !currentTiles[key].error;
          
          // Only add if not already loaded, not in queue, and not already added with higher priority
          if (!isAlreadyLoaded && 
              !tileQueue().some(t => t.x === x && t.y === y) &&
              !tilesToLoad.some(t => t.x === x && t.y === y)) {
            tilesToLoad.push({ x, y, priority });
          }
        }
      }
    }
    
    if (tilesToLoad.length > 0) {
      console.log(`[scheduleTilesForLoading] Scheduling ${tilesToLoad.length} tiles for loading`);
      // Sort by priority and then add to queue
      tilesToLoad.sort((a, b) => a.priority - b.priority);
      console.log('[scheduleTilesForLoading] Tiles to load:', tilesToLoad);
      setTileQueue(prev => [...prev, ...tilesToLoad]);
      
      // Process the queue if not already processing
      if (!isProcessingQueue()) {
        console.log('[scheduleTilesForLoading] Starting queue processing');
        setTimeout(processTileQueue, 0);
      }
    }
  };
  
  // Update viewport and schedule tiles for loading
  const updateViewport = (updates: Partial<Viewport>) => {
    setViewport(prev => ({
      ...prev,
      ...updates
    }));
    
    // Schedule tiles for loading on the next tick
    setTimeout(scheduleTilesForLoading, 0);
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
    setLastMousePosition({ x: e.clientX, y: e.clientY });
    const vp = viewport();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY,
      startX: vp.x,
      startY: vp.y
    });
    document.body.style.cursor = 'grabbing';
  };

  // Handle mouse up for dragging
  const handleMouseUp = () => {
    if (isDragging()) {
      setIsDragging(false);
      if (typeof document !== 'undefined') {
        document.body.style.cursor = '';
      }
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging() && lastMousePosition()) {
      e.preventDefault();
      const dx = e.clientX - lastMousePosition()!.x;
      const dy = e.clientY - lastMousePosition()!.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x - dx / prev.zoom,
        y: prev.y - dy / prev.zoom
      }));
      
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse leave for dragging
  const handleMouseLeave = () => {
    if (isDragging()) {
      setIsDragging(false);
      if (typeof document !== 'undefined') {
        document.body.style.cursor = '';
      }
    }
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
    
    // Get mouse position relative to viewport
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate zoom factor (zoom in/out based on wheel direction)
    const zoomDelta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    const currentViewport = viewport();
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentViewport.zoom + zoomDelta));
    
    // If zoom level didn't change, do nothing
    if (newZoom === currentViewport.zoom) return;
    
    // Calculate mouse position in world coordinates before zoom
    const worldX = currentViewport.x + mouseX / currentViewport.zoom;
    const worldY = currentViewport.y + mouseY / currentViewport.zoom;
    
    // Calculate new viewport position to zoom toward mouse
    const newX = worldX - (mouseX / newZoom);
    const newY = worldY - (mouseY / newZoom);
    
    updateViewport({
      zoom: newZoom,
      x: Math.max(0, newX),
      y: Math.max(0, newY)
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

  // Render a single tile
  const renderTile = (tile: Tile) => {
    const vp = viewport();
    const zoom = vp.zoom;
    
    // Convert tile coordinates to screen coordinates
    const screenX = (tile.x * TILE_SIZE - vp.x) * zoom;
    const screenY = (tile.y * TILE_SIZE - vp.y) * zoom;
    const scaledSize = TILE_SIZE * zoom;
    
    // Skip rendering if tile is outside viewport with some padding
    const padding = TILE_SIZE * 2; // Render tiles slightly outside viewport
    if (screenX + scaledSize + padding < 0 || 
        screenX - padding > vp.width ||
        screenY + scaledSize + padding < 0 || 
        screenY - padding > vp.height) {
      return null;
    }
    
    // Render tile content based on data
    let content;
    if (tile.loading) {
      content = <div class={styles.loading}>Loading...</div>;
    } else if (tile.error) {
      content = <div class={styles.error}>Error</div>;
    } else if (tile.data) {
      const tileImage = renderBitmap(tile.data);
      
      content = (
        <>
          <img 
            src={tileImage}
            alt={`Tile ${tile.x},${tile.y}`}
            class={styles.tileImage}
            draggable={false}
          />
          <div class={styles.tileCoords}>
            {tile.x},{tile.y}
          </div>
        </>
      );
    }
    
    return (
      <div 
        class={`${styles.tile} ${tile.loading ? styles.loading : ''} ${tile.error ? styles.error : ''}`}
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${scaledSize}px`,
          height: `${scaledSize}px`
        }}
      >
        {content}
      </div>
    );
  };

  // Convert Uint8Array to an image data URL
  const renderBitmap = (data: Uint8Array): string => {
    // Skip in SSR
    if (typeof document === 'undefined') return '';
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return '';
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Draw a light grid
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      
      // Draw grid lines for every 8 pixels
      for (let i = 0; i <= TILE_SIZE; i += 8) {
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, TILE_SIZE);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(TILE_SIZE, i);
        ctx.stroke();
      }
      
      // Draw points from bitmap data (1 bit per pixel)
      ctx.fillStyle = '#1976d2';
      
      // Process bitmap data (1 bit per pixel)
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          const bitIndex = y * TILE_SIZE + x;
          const byteIndex = Math.floor(bitIndex / 8);
          const bitInByte = bitIndex % 8;
          
          // Check if the bit is set (1 = occupied, 0 = empty)
          if (byteIndex < data.length && (data[byteIndex] & (1 << (7 - bitInByte)))) {
            // Draw a 1x1 pixel for each point
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error rendering bitmap:', error);
      return '';
    }
  };

  // Render coordinate grid
  const renderGrid = () => {
    const vp = viewport();
    const gridSize = 100; // Grid size in world coordinates
    const startX = Math.floor(vp.x / gridSize) * gridSize;
    const startY = Math.floor(vp.y / gridSize) * gridSize;
    const endX = startX + (vp.width / vp.zoom) + gridSize;
    const endY = startY + (vp.height / vp.zoom) + gridSize;
    
    const lines = [];
    const labels = [];
    
    // Add grid lines
    for (let x = startX; x <= endX; x += gridSize) {
      const screenX = (x - vp.x) * vp.zoom;
      lines.push(
        <line 
          x1={screenX} y1="0" 
          x2={screenX} y2={vp.height} 
          class={styles.gridLine}
          stroke={x === 0 ? '#ff0000' : '#888888'}
        />
      );
      
      // Add x-axis labels
      if (x % (gridSize * 5) === 0) {
        labels.push(
          <text 
            x={screenX + 5} 
            y={15} 
            class={styles.coordinateLabel}
            fill={x === 0 ? '#ff0000' : '#000000'}
          >
            {x}
          </text>
        );
      }
    }
    
    for (let y = startY; y <= endY; y += gridSize) {
      const screenY = (y - vp.y) * vp.zoom;
      lines.push(
        <line 
          x1="0" y1={screenY} 
          x2={vp.width} y2={screenY} 
          class={styles.gridLine}
          stroke={y === 0 ? '#ff0000' : '#888888'}
        />
      );
      
      // Add y-axis labels
      if (y % (gridSize * 5) === 0 && y !== 0) {
        labels.push(
          <text 
            x={5} 
            y={screenY - 5} 
            class={styles.coordinateLabel}
            fill={y === 0 ? '#ff0000' : '#000000'}
          >
            {y}
          </text>
        );
      }
    }
    
    return (
      <svg class={styles.gridOverlay}>
        {lines}
        {labels}
      </svg>
    );
  };

  return (
    <div 
      class={styles.mapContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        'touch-action': 'none' as const,
        'user-select': 'none'
      }}
    >
      {renderGrid()}
      <div 
        class={styles.mapViewport}
        style={{
          width: '100%',
          height: '100%',
          cursor: isDragging() ? 'grabbing' : 'grab',
          position: 'relative',
          overflow: 'hidden',
          'touch-action': 'none'
        }}
      >
        <div 
          class={styles.mapContent}
          style={{
            transform: `translate(${-viewport().x}px, ${-viewport().y}px) scale(${viewport().zoom})`,
            width: '100000px', // Large enough to contain the entire map
            height: '100000px' // Large enough to contain the entire map
          }}
        >
          {Object.values(tiles()).map(tile => renderTile(tile))}
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
            onClick={() => updateViewport({
              zoom: Math.min(MAX_ZOOM, viewport().zoom + ZOOM_STEP)
            })}
            disabled={viewport().zoom >= MAX_ZOOM}
          >
            +
          </button>
          <button 
            onClick={() => updateViewport({
              zoom: Math.max(MIN_ZOOM, viewport().zoom - ZOOM_STEP)
            })}
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
