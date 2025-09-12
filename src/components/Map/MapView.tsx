import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
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
  const [viewport, setViewport] = createSignal<Viewport>({ 
    x: 0, 
    y: 0,
    zoom: 1.0,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT
  });
  const [isDragging, setIsDragging] = createSignal(false);
  const [dragStart, setDragStart] = createSignal({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [tileCacheState, setTileCache] = createSignal<Record<string, boolean>>({});
  const [tileQueue, setTileQueue] = createSignal<Array<{x: number, y: number}>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = createSignal(false);

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
    const key = getTileKey(tileX, tileY);
    const currentTiles = tiles();
    
    // Skip if already loading or loaded recently
    if (currentTiles[key]?.loading || (currentTiles[key] && Date.now() - currentTiles[key].timestamp < 30000)) {
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
      const response = await fetch(`/api/map/tile/${tileX}/${tileY}`);
      if (!response.ok) {
        throw new Error(`Failed to load tile (${tileX}, ${tileY}): ${response.statusText}`);
      }

      const data = await response.json();
      const etag = response.headers.get('ETag') || undefined;
      
      // Convert base64 data back to Uint8Array
      const binaryString = atob(data.data.data);
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
      console.error(`Error loading tile (${tileX}, ${tileY}):`, err);
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
  };

  // Process the tile loading queue with priority to visible tiles
  const processTileQueue = async () => {
    if (isProcessingQueue() || tileQueue().length === 0) return;
    
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
      for (let i = 0; i < queue.length; i += BATCH_SIZE) {
        const batch = queue.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(({x, y}) => loadTile(x, y)));
        
        // Small delay between batches to keep the UI responsive
        if (i + BATCH_SIZE < queue.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (err) {
      console.error('Error processing tile queue:', err);
      setError('Error loading map data');
    } finally {
      setIsProcessingQueue(false);
      
      // If new tiles were added while processing, process them
      if (tileQueue().length > 0) {
        setTimeout(processTileQueue, 0);
      }
    }
  };
  
  // Schedule tiles for loading based on viewport with priority levels
  const scheduleTilesForLoading = () => {
    const vp = viewport();
    const zoom = vp.zoom;
    
    // Calculate visible area in world coordinates
    const startX = vp.x;
    const startY = vp.y;
    const endX = startX + vp.width / zoom;
    const endY = startY + vp.height / zoom;
    
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
      // Sort by priority and then add to queue
      tilesToLoad.sort((a, b) => a.priority - b.priority);
      setTileQueue(prev => [...prev, ...tilesToLoad]);
      
      // Process the queue if not already processing
      if (!isProcessingQueue()) {
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
    
    // Skip in SSR
    if (typeof document === 'undefined') return;
    
    // Ignore if clicking on a control element
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    document.body.style.cursor = 'grabbing';
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    
    const currentDragStart = dragStart();
    const currentViewport = viewport();
    const dx = (e.clientX - currentDragStart.x) / currentViewport.zoom;
    const dy = (e.clientY - currentDragStart.y) / currentViewport.zoom;
    
    updateViewport({
      x: Math.max(0, currentViewport.x - dx),
      y: Math.max(0, currentViewport.y - dy)
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
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
      
      // Draw grid and points
      const gridSize = 8;
      const cellSize = TILE_SIZE / gridSize;
      
      // Draw grid lines
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, TILE_SIZE);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(TILE_SIZE, i * cellSize);
        ctx.stroke();
      }
      
      // Draw points from bitmap data
      ctx.fillStyle = '#1976d2';
      
      // Process bitmap data (1 bit per coordinate)
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const bitIndex = y * gridSize + x;
          const byteIndex = Math.floor(bitIndex / 8);
          const bitInByte = bitIndex % 8;
          
          // Check if the bit is set
          if (byteIndex < data.length && (data[byteIndex] & (1 << bitInByte))) {
            const centerX = (x + 0.5) * cellSize;
            const centerY = (y + 0.5) * cellSize;
            const radius = cellSize * 0.4;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error rendering bitmap:', error);
      return '';
    }
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
