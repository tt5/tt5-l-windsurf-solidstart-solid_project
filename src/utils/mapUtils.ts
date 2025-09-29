import { inflate } from 'pako';

export const TILE_SIZE = 64; // pixels

interface Point {
  x: number;
  y: number;
}

// Extract black pixels from a bitmap
const extractBlackPixels = (bitmap: Uint8Array): Point[] => {
  const blackPixels: Point[] = [];
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

/**
 * Checks if a tile is stale and needs to be refreshed
 * @param tile - The tile to check
 * @returns boolean indicating if the tile is stale
 */
export const isTileStale = (tile: { timestamp: number; error?: boolean } | undefined): boolean => {
  if (!tile) return true;
  if (tile.error) return true; // Always refresh errored tiles
  const tileAge = Date.now() - tile.timestamp;
  return tileAge > 20 * 1000; // 20 seconds threshold
};

/**
 * Generates a unique key for a tile based on its coordinates
 * @param x - X coordinate of the tile
 * @param y - Y coordinate of the tile
 * @returns A string key in the format "x,y"
 */
export const getTileKey = (x: number, y: number): string => `${x},${y}`;

/**
 * Converts world coordinates to tile coordinates
 * @param x - World X coordinate
 * @param y - World Y coordinate
 * @returns Object containing tileX and tileY
 */
export const worldToTileCoords = (x: number, y: number) => ({
  tileX: Math.floor(x / TILE_SIZE),
  tileY: Math.floor(y / TILE_SIZE)
});

/**
 * Converts tile coordinates to world coordinates
 * @param tileX - Tile X coordinate
 * @param tileY - Tile Y coordinate
 * @returns Object containing x and y world coordinates
 */
export const tileToWorldCoords = (tileX: number, tileY: number) => ({
  x: tileX * TILE_SIZE,
  y: tileY * TILE_SIZE
});

/**
 * Gets the initial viewport dimensions
 * @param containerRef - Reference to the container element
 * @param defaultWidth - Default width if container ref is not available
 * @param defaultHeight - Default height if container ref is not available
 * @returns Viewport object with x, y, width, and height
 */
export const getInitialViewport = (
  containerRef: HTMLElement | undefined, 
  defaultWidth: number, 
  defaultHeight: number
) => {
  const width = containerRef?.clientWidth || defaultWidth;
  const height = containerRef?.clientHeight || defaultHeight;
  return {
    x: 0,
    y: 0,
    width,
    height
  };
};

/**
 * Handles viewport resize
 * @param containerRef - Reference to the container element
 * @param setViewport - Function to update the viewport state
 * @param scheduleTilesForLoading - Function to schedule tile loading
 */
export const handleResize = (
  containerRef: HTMLElement | undefined,
  setViewport: (updater: (prev: any) => any) => void,
  scheduleTilesForLoading: () => void
) => {
  if (containerRef) {
    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;
    setViewport((prev: any) => ({
      ...prev,
      width,
      height
    }));
    // Reschedule tiles after a short delay to avoid excessive updates
    setTimeout(scheduleTilesForLoading, 100);
  }
};

/**
 * Loads all visible tiles that are stale
 * @param currentTiles - Current tiles state
 * @param isMounted - Function to check if component is mounted
 * @param isTileStale - Function to check if a tile is stale
 * @param loadTile - Function to load a tile
 */
export const loadVisibleTiles = (
  currentTiles: Record<string, any>,
  isMounted: () => boolean,
  isTileStale: (tile: any) => boolean,
  loadTile: (x: number, y: number, force: boolean) => Promise<void>
) => {
  if (!isMounted()) {
    return;
  }
  
  Object.values(currentTiles).forEach(tile => {
    if (isTileStale(tile)) {
      loadTile(tile.x, tile.y, true).catch(error => {
        console.error(`[loadVisibleTiles] Error refreshing tile (${tile.x}, ${tile.y}):`, error);
      });
    }
  });
};

/**
 * Updates the viewport and schedules tiles for loading
 * @param updates - Partial viewport updates
 * @param setViewport - Function to update the viewport state
 * @param scheduleTilesForLoading - Function to schedule tile loading
 * @returns New viewport state
 */
export const updateViewport = (
  updates: Partial<{ x: number; y: number; width: number; height: number }>,
  setViewport: (updater: (prev: any) => any) => void,
  scheduleTilesForLoading: () => void
) => {
  setViewport((prev: any) => {
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

/**
 * Converts tile data to an array of black pixel coordinates
 * @param tileData - The tile data to render (Uint8Array or string)
 * @returns Array of {x, y} coordinates for black pixels
 */
export const renderBitmap = (tileData: Uint8Array | string): Point[] => {
  // Skip in SSR
  if (typeof document === 'undefined') return [];
  
  // Early return for invalid input
  if (!(tileData instanceof Uint8Array) || tileData.length === 0) {
    console.log('Invalid or empty tile data');
    return [];
  }

  // Check version byte (0x01 for our format)
  if (tileData[0] !== 0x01) {
    console.log('Unsupported data format or missing version byte');
    return [];
  }

  try {
    // Skip the first byte (version) and decompress the rest
    const compressedData = tileData.subarray(1);
    const decompressed = inflate(compressedData);
    
    // Validate decompressed size (1-bit per pixel)
    const expectedSize = Math.ceil((TILE_SIZE * TILE_SIZE) / 8);
    if (decompressed.length !== expectedSize) {
      console.warn(`Unexpected decompressed size: ${decompressed.length}, expected ${expectedSize}`);
    }

    return extractBlackPixels(decompressed);
  } catch (error) {
    console.error('Failed to process tile data:', error);
    return [];
  }
};
