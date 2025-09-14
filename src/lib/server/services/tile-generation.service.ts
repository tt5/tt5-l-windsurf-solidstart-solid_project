import { getBasePointRepository, getMapTileRepository } from '~/lib/server/db';
import { MapTile } from '~/lib/server/repositories/map-tile.repository';
import { deflate, inflate } from 'pako';

const TILE_SIZE = 64; // 64x64 coordinates per tile
const BITS_PER_BYTE = 8;

// Compression level (0-9, where 9 is best compression but slowest)
const COMPRESSION_LEVEL = 6;

export class TileGenerationService {
  /**
   * Generate a tile for the given coordinates
   */
  async generateTile(tileX: number, tileY: number): Promise<MapTile> {
    const basePointRepo = await getBasePointRepository();
    const tileRepo = await getMapTileRepository();
    
    // Get the bounds of the tile in world coordinates
    const { minX, minY, maxX, maxY } = this.getTileBounds(tileX, tileY);
    
    // Get all base points within this tile
    const basePoints = await basePointRepo.getPointsInBounds(minX, minY, maxX, maxY);
    
    // Try to get existing tile data
    const existingTile = await tileRepo.getTile(tileX, tileY);
    
    // If tile exists and has the same base points, return it
    if (existingTile) {
      const existingBitmap = existingTile.data;
      const newBitmap = this.createBitmap(basePoints, minX, minY);
      
      // Compare bitmaps
      if (existingBitmap.length === newBitmap.length &&
          existingBitmap.every((val, i) => val === newBitmap[i])) {
        return existingTile; // No changes, return existing tile
      }
    }
    
    // Create a new bitmap for this tile
    const bitmap = this.createBitmap(basePoints, minX, minY);
    
    // Create the tile
    const now = Date.now();
    // Create a compressed version of the data for storage
    const compressedData = Buffer.concat([
      Buffer.from([0x01]), // Version 1
      Buffer.from(deflate(bitmap, { level: COMPRESSION_LEVEL }))
    ]);
    
    return {
      tileX,
      tileY,
      data: bitmap,
      compressedData,
      version: 1,
      lastUpdatedMs: now
    };
  }
  
  /**
   * Get the world coordinates bounds for a tile
   */
  private getTileBounds(tileX: number, tileY: number) {
    return {
      minX: tileX * TILE_SIZE,
      minY: tileY * TILE_SIZE,
      maxX: (tileX + 1) * TILE_SIZE - 1,
      maxY: (tileY + 1) * TILE_SIZE - 1
    };
  }
  
  /**
   * Create a compressed bitmap from base points
   */
  private createBitmap(
    points: Array<{x: number; y: number}>,
    offsetX: number,
    offsetY: number
  ): Buffer {
    // Each bit represents a coordinate, so we need TILE_SIZE^2 bits
    const bitmapSize = Math.ceil((TILE_SIZE * TILE_SIZE) / BITS_PER_BYTE);
    const bitmap = new Uint8Array(bitmapSize);
    
    // Set bits for each point
    for (const point of points) {
      // Convert world coordinates to tile-relative coordinates
      const x = point.x - offsetX;
      const y = point.y - offsetY;
      
      // Skip points outside the tile bounds (shouldn't happen due to query)
      if (x < 0 || x >= TILE_SIZE || y < 0 || y >= TILE_SIZE) {
        continue;
      }
      
      // Calculate the bit position
      const bitPosition = y * TILE_SIZE + x;
      const byteIndex = Math.floor(bitPosition / BITS_PER_BYTE);
      const bitIndex = bitPosition % BITS_PER_BYTE;
      
      // Set the bit
      bitmap[byteIndex] |= (1 << bitIndex);
    }
    
    // Compress the bitmap
    const compressed = deflate(bitmap, { level: COMPRESSION_LEVEL });
    
    // Add a header to identify the compression method
    const header = Buffer.alloc(1);
    header[0] = 0x01; // Version 1: Deflate compression
    
    return Buffer.concat([header, Buffer.from(compressed)]);
  }
  
  /**
   * Decompress a compressed bitmap
   */
  decompressBitmap(compressed: Buffer): Uint8Array {
    if (compressed.length === 0) {
      return new Uint8Array(0);
    }
    
    const version = compressed[0];
    const data = compressed.subarray(1);
    
    if (version === 0x01) {
      // Deflate compression
      return inflate(data);
    }
    
    // Fallback: assume uncompressed data
    return new Uint8Array(data);
  }
  
  /**
   * Get the tile coordinates for a world position
   */
  static worldToTileCoords(x: number, y: number) {
    return {
      tileX: Math.floor(x / TILE_SIZE),
      tileY: Math.floor(y / TILE_SIZE)
    };
  }
  
  /**
   * Get all tile coordinates that intersect with the given world bounds
   */
  static getTilesInBounds(minX: number, minY: number, maxX: number, maxY: number) {
    const minTile = this.worldToTileCoords(minX, minY);
    const maxTile = this.worldToTileCoords(maxX, maxY);
    
    const tiles: Array<{x: number; y: number}> = [];
    
    for (let y = minTile.tileY; y <= maxTile.tileY; y++) {
      for (let x = minTile.tileX; x <= maxTile.tileX; x++) {
        tiles.push({ x, y });
      }
    }
    
    return tiles;
  }
}

// Export a singleton instance
export const tileGenerationService = new TileGenerationService();
