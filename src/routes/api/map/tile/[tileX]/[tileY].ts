import { getMapTileRepository } from '~/lib/server/db';
import { withAuth } from '~/middleware/auth';
import { createApiResponse, createErrorResponse, generateRequestId } from '~/utils/api';
import type { MapTile } from '~/lib/server/repositories/map-tile.repository';
import { tileGenerationService } from '~/lib/server/services/tile-generation.service';
import { tileCacheService } from '~/lib/server/services/tile-cache.service';

// World bounds in world coordinates
const WORLD_BOUNDS = {
  min: -1000,
  max: 1000
};

// Calculate maximum tile coordinates based on world bounds and tile size (64x64)
const TILE_SIZE = 64;
const MAX_TILE_COORD = Math.ceil(WORLD_BOUNDS.max / TILE_SIZE);
const MIN_TILE_COORD = Math.floor(WORLD_BOUNDS.min / TILE_SIZE);

// Validate tile coordinates
const validateTileCoords = (tileX: number, tileY: number) => {
  if (typeof tileX !== 'number' || typeof tileY !== 'number' || 
      isNaN(tileX) || isNaN(tileY)) {
    throw new Error('Tile coordinates must be valid numbers');
  }
  
  if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) {
    throw new Error('Tile coordinates must be whole numbers');
  }
  
  if (tileX < MIN_TILE_COORD || tileX > MAX_TILE_COORD || 
      tileY < MIN_TILE_COORD || tileY > MAX_TILE_COORD) {
    throw new Error(`Tile coordinates must be between ${MIN_TILE_COORD} and ${MAX_TILE_COORD}`);
  }
};

// Handle API errors consistently
const handleApiError = (error: unknown, requestId: string, endpoint: string) => {
  console.error(`[${requestId}] Error in ${endpoint}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('coordinates must be')) {
      return createErrorResponse(error.message, 400, undefined, { requestId });
    }
    return createErrorResponse(`Internal server error: ${error.message}`, 500, undefined, { requestId });
  }
  
  return createErrorResponse('An unknown error occurred', 500, undefined, { requestId });
};

export const GET = withAuth(async (event) => {
  const { params } = event;
  const requestId = generateRequestId();
  const { tileX: tileXStr, tileY: tileYStr } = params;
  
  try {
    // Parse and validate coordinates
    const tileX = parseInt(tileXStr, 10);
    const tileY = parseInt(tileYStr, 10);
    validateTileCoords(tileX, tileY);
    
    // Try to get tile from cache first
    let tile: MapTile | null = null;
    let fromCache = true;
    
    try {
      // Try to get from cache
      tile = await tileCacheService.get(tileX, tileY);
      
      if (tile) {
      } else {
        // If not in cache, generate and cache it
        const tileRepo = await getMapTileRepository();
        tile = await tileGenerationService.generateTile(tileX, tileY);
        
        if (tile) {
          await tileRepo.saveTile(tile);
          await tileCacheService.set(tile);
          fromCache = false;
        } else {
          throw new Error('Failed to generate tile');
        }
      }
    } catch (error) {
      console.error(`[Tile API] Error processing tile (${tileX}, ${tileY}):`, error);
      throw error;
    }
    
    if (!tile) {
      throw new Error('Tile not found and could not be generated');
    }
    
    // Prepare response data
    const responseData = {
      success: true,
      data: {
        tileX: tile.tileX,
        tileY: tile.tileY,
        data: tile.data ? Array.from(tile.data).join(',') : '', // Safely handle undefined data
        version: tile.version || 1,
        lastUpdatedMs: tile.lastUpdatedMs || Date.now(),
        fromCache,
        // Add tile bounds for client-side convenience
        bounds: {
          minX: tile.tileX * 64,
          minY: tile.tileY * 64,
          maxX: (tile.tileX + 1) * 64 - 1,
          maxY: (tile.tileY + 1) * 64 - 1
        }
      },
      requestId
    };

    // Set cache headers (10 seconds client cache, 10 seconds CDN cache)
    const lastUpdated = tile.lastUpdatedMs || Date.now();
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=10, s-maxage=10',
      'ETag': `"${lastUpdated}"`,
      'Last-Modified': new Date(lastUpdated).toUTCString()
    });

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers
    });
    
  } catch (error) {
    return handleApiError(error, requestId, `GET /api/map/tile/${tileXStr}/${tileYStr}`);
  }
});

// Handle OPTIONS for CORS preflight
export const OPTIONS = () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
};
