import { Database } from 'sqlite';
import { BasePoint } from '../../../types/board';

export class BasePointRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<BasePoint[]> {
    const results = await this.db.all<BasePoint[]>(
      'SELECT id, user_id as userId, x, y, created_at_ms as createdAtMs FROM base_points'
    );
    return results || [];
  }

  async getByUser(userId: string): Promise<BasePoint[]> {
    const results = await this.db.all<BasePoint[]>(
      'SELECT id, user_id as userId, x, y, created_at_ms as createdAtMs FROM base_points WHERE user_id = ?',
      [userId]
    );
    return results || [];
  }

  async getPointsInBounds(minX: number, minY: number, maxX: number, maxY: number): Promise<BasePoint[]> {
    const results = await this.db.all<BasePoint[]>(
      `SELECT id, user_id as userId, x, y, created_at_ms as createdAtMs 
       FROM base_points 
       WHERE x BETWEEN ? AND ? AND y BETWEEN ? AND ?`,
      [minX, maxX, minY, maxY]
    );
    return results || [];
  }

  async add(userId: string, x: number, y: number): Promise<BasePoint> {
    const now = Date.now();
    console.log(`[BasePointRepository] Adding base point - userId: ${userId}, x: ${x}, y: ${y}`);
    
    try {
      // Start a transaction to ensure both operations succeed or fail together
      console.log('[BasePointRepository] Starting transaction');
      await this.db.run('BEGIN TRANSACTION');
      
      try {
        // Check if user exists in users table
        console.log(`[BasePointRepository] Verifying user exists: ${userId}`);
        const userExists = await this.db.get<{count: number}>(
          'SELECT COUNT(*) as count FROM users WHERE id = ?',
          [userId]
        );
        
        if (!userExists || userExists.count === 0) {
          throw new Error(`User ${userId} not found`);
        }
        
        console.log(`[BasePointRepository] User ${userId} verified`);

        // First, try to get the existing base point
        console.log(`[BasePointRepository] Checking for existing base point at (${x}, ${y})`);
        const existing = await this.db.get<BasePoint>(
          'SELECT id, x, y, created_at_ms as createdAtMs FROM base_points WHERE user_id = ? AND x = ? AND y = ?',
          [userId, x, y]
        );

        if (existing) {
          console.log(`[BasePointRepository] Found existing base point:`, existing);
          await this.db.run('COMMIT');
          return existing;
        }

        // Insert the new base point
        console.log(`[BasePointRepository] Inserting new base point`);
        const result = await this.db.run(
          'INSERT INTO base_points (user_id, x, y, created_at_ms, updated_at_ms) VALUES (?, ?, ?, ?, ?)',
          [userId, x, y, now, now]
        );
        
        console.log(`[BasePointRepository] Base point inserted with ID: ${result.lastID}`);
        await this.db.run('COMMIT');
        
        return {
          id: result.lastID!,
          x,
          y,
          userId,
          createdAtMs: now
        };
      } catch (error) {
        console.error('[BasePointRepository] Error in transaction:', error);
        await this.db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('[BasePointRepository] Error in add method:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        x,
        y,
        now,
        dbState: {
          userExists: await this.db.get('SELECT id, username FROM users WHERE id = ?', [userId]),
          basePoints: await this.db.all('SELECT * FROM base_points WHERE user_id = ?', [userId])
        }
      });
      throw new Error(`Failed to add base point: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * DEVELOPMENT-ONLY: Removes all base points for a specific user.
   * 
   * ⚠️ This method should only be used in development mode and is called
   * exclusively through the DevTools interface. It is protected by environment
   * checks in the API layer and will be disabled in production.
   * 
   * @param userId - The ID of the user whose base points should be removed
   * @returns A promise that resolves when the operation is complete
   * @throws {Error} If called in production environment
   */
  async deleteAllBasePointsForUser(userId: string): Promise<void> {
    await this.db.run('DELETE FROM base_points WHERE user_id = ?', [userId]);
  }

}
