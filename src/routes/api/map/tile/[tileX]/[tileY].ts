import { getMapTileRepository } from '~/lib/server/db';
import { withAuth } from '~/middleware/auth';
import { createApiResponse, createErrorResponse, generateRequestId } from '~/utils/api';
import type { MapTile } from '~/lib/server/repositories/map-tile.repository';
import { tileGenerationService } from '~/lib/server/services/tile-generation.service';

// Maximum tile coordinates to prevent abuse
const MAX_TILE_COORD = 10000;

// Validate tile coordinates
const validateTileCoords = (tileX: number, tileY: number) => {
  if (typeof tileX !== 'number' || typeof tileY !== 'number' || 
      isNaN(tileX) || isNaN(tileY)) {
    throw new Error('Tile coordinates must be valid numbers');
  }
  
  if (!Number.isInteger(tileX) || !Number.isInteger(tileY)) {
    throw new Error('Tile coordinates must be whole numbers');
  }
  
  if (Math.abs(tileX) > MAX_TILE_COORD || Math.abs(tileY) > MAX_TILE_COORD) {
    throw new Error(`Tile coordinates must be between -${MAX_TILE_COORD} and ${MAX_TILE_COORD}`);
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
    
    // Always generate a fresh tile
    const tileRepo = await getMapTileRepository();
    const tile = await tileGenerationService.generateTile(tileX, tileY);
    await tileRepo.saveTile(tile);
    // fromCache is not used anymore, but keeping it for now to avoid breaking the response
    
    // Return the tile data with appropriate headers
    return new Response(JSON.stringify({
      success: true,
      data: {
        tileX: tile.tileX,
        tileY: tile.tileY,
        data: Buffer.from(tile.data).toString('base64'), // Convert Uint8Array to base64 for JSON
        version: tile.version,
        lastUpdatedMs: tile.lastUpdatedMs,
        // Add tile bounds for client-side convenience
        bounds: {
          minX: tile.tileX * 64,
          minY: tile.tileY * 64,
          maxX: (tile.tileX + 1) * 64 - 1,
          maxY: (tile.tileY + 1) * 64 - 1
        }
      },
      requestId
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'ETag': `"${tile.version}"`,
        'X-Tile-Generated': String(tile.version === 1)
      }
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
