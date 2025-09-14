import { Database } from 'sqlite';
import { inflate, deflate } from 'pako';

export interface MapTile {
  tileX: number;
  tileY: number;
  data: Uint8Array; // Raw bitmap data (uncompressed)
  compressedData: Buffer; // Compressed data stored in DB
  version: number;
  lastUpdatedMs: number;
}

// Compression level (0-9, where 9 is best compression but slowest)
const COMPRESSION_LEVEL = 6;

export class MapTileRepository {
  private static readonly TILE_SIZE = 64; // 64x64 coordinates per tile
  
  constructor(private db: Database) {}

  /**
   * Get a map tile by its coordinates
   */
  async getTile(tileX: number, tileY: number): Promise<MapTile | null> {
    const result = await this.db.get<{
      tile_x: number;
      tile_y: number;
      data: Buffer;
      version: number;
      last_updated_ms: number;
    }>(
      'SELECT tile_x, tile_y, data, version, last_updated_ms ' +
      'FROM map_tiles WHERE tile_x = ? AND tile_y = ?',
      [tileX, tileY]
    );

    if (!result) return null;
    
    // Decompress the data
    const compressedData = result.data;
    let data: Uint8Array;
    
    if (compressedData.length > 0) {
      const version = compressedData[0];
      const compressed = compressedData.subarray(1);
      
      if (version === 0x01) {
        // Deflate compression
        data = inflate(compressed);
      } else {
        // Uncompressed data
        data = new Uint8Array(compressed);
      }
    } else {
      // Empty data
      data = new Uint8Array(0);
    }

    return {
      tileX: result.tile_x,
      tileY: result.tile_y,
      data,
      compressedData: result.data, // Store the compressed data as-is
      version: result.version,
      lastUpdatedMs: result.last_updated_ms
    };
  }

  /**
   * Save or update a map tile
   */
  async saveTile(tile: Omit<MapTile, 'version' | 'compressedData'> & { 
    version?: number;
    compressedData?: Buffer;
  }): Promise<void> {
    const now = Date.now();
    const version = (tile.version || 0) + 1;
    
    // If we don't have compressed data, compress the raw data
    let dataToSave = tile.compressedData;
    if (!dataToSave && tile.data) {
      // Add version byte (0x01 for deflate)
      const header = Buffer.alloc(1);
      header[0] = 0x01;
      
      // Compress the data
      const compressed = deflate(tile.data, { level: COMPRESSION_LEVEL });
      dataToSave = Buffer.concat([header, Buffer.from(compressed)]);
    }
    
    await this.db.run(
      `INSERT INTO map_tiles (tile_x, tile_y, data, version, last_updated_ms)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(tile_x, tile_y) DO UPDATE SET
         data = excluded.data,
         version = excluded.version,
         last_updated_ms = excluded.last_updated_ms`,
      [tile.tileX, tile.tileY, dataToSave, version, now]
    );
  }

  /**
   * Get multiple tiles within a bounding box
   */
  async getTilesInBounds(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): Promise<MapTile[]> {
    type DatabaseTile = {
      tile_x: number;
      tile_y: number;
      data: Buffer;
      version: number;
      last_updated_ms: number;
    };

    const results: DatabaseTile[] = await this.db.all(
      'SELECT tile_x, tile_y, data, version, last_updated_ms ' +
      'FROM map_tiles ' +
      'WHERE tile_x BETWEEN ? AND ? AND tile_y BETWEEN ? AND ?',
      [minX, maxX, minY, maxY]
    ) as unknown as DatabaseTile[];

    return results.map((result) => ({
      tileX: result.tile_x,
      tileY: result.tile_y,
      data: result.data,
      compressedData: result.data, // Using the same data for compressedData since it's already compressed
      version: result.version,
      lastUpdatedMs: result.last_updated_ms
    }));
  }

  /**
   * Convert world coordinates to tile coordinates
   */
  static worldToTileCoords(x: number, y: number): { tileX: number; tileY: number } {
    return {
      tileX: Math.floor(x / this.TILE_SIZE),
      tileY: Math.floor(y / this.TILE_SIZE)
    };
  }

  /**
   * Get the bounds of a tile in world coordinates
   */
  static getTileBounds(tileX: number, tileY: number): { minX: number; minY: number; maxX: number; maxY: number } {
    return {
      minX: tileX * this.TILE_SIZE,
      minY: tileY * this.TILE_SIZE,
      maxX: (tileX + 1) * this.TILE_SIZE - 1,
      maxY: (tileY + 1) * this.TILE_SIZE - 1
    };
  }

  /**
   * Delete all tiles from the database
   * Primarily for testing purposes
   */
  async deleteAllTiles(): Promise<void> {
    await this.db.run('DELETE FROM map_tiles');
  }
}

