import { Database } from 'sqlite';
import { BasePoint } from '../../types/board';

export class BasePointRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<BasePoint[]> {
    return this.db.all<BasePoint>(
      'SELECT id, user_id as userId, x, y, created_at_ms as createdAtMs FROM base_points'
    );
  }

  async getByUser(userId: string): Promise<BasePoint[]> {
    return this.db.all<BasePoint>(
      'SELECT id, x, y, created_at_ms as createdAtMs FROM base_points WHERE user_id = ?',
      [userId]
    );
  }

  async add(userId: string, x: number, y: number): Promise<BasePoint> {
    const now = Date.now();
    
    try {
      // Start a transaction to ensure both operations succeed or fail together
      await this.db.run('BEGIN TRANSACTION');
      
      // Check if user exists in user_tables or create a new entry
      await this.db.run(
        `INSERT INTO user_tables (user_id, table_name, created_at_ms) 
         VALUES (?, ?, ?) 
         ON CONFLICT(user_id) DO NOTHING`,
        [userId, `user_${userId}`, now]
      );

      // First, try to get the existing base point
      const existing = await this.db.get<BasePoint>(
        'SELECT id, x, y, created_at_ms as createdAtMs FROM base_points WHERE user_id = ? AND x = ? AND y = ?',
        [userId, x, y]
      );

      if (existing) {
        await this.db.run('COMMIT');
        return existing;
      }

      // Insert the new base point
      const result = await this.db.run(
        'INSERT INTO base_points (user_id, x, y, created_at_ms, updated_at_ms) VALUES (?, ?, ?, ?, ?)',
        [userId, x, y, now, now]
      );
      
      await this.db.run('COMMIT');
      
      return {
        id: result.lastID!,
        x,
        y,
        userId,
        createdAtMs: now
      };
    } catch (error) {
      await this.db.run('ROLLBACK');
      console.error('Error in BasePointRepository.add:', error);
      throw new Error(`Failed to add base point: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async remove(userId: string, x: number, y: number): Promise<boolean> {
    const result = await this.db.run(
      'DELETE FROM base_points WHERE user_id = ? AND x = ? AND y = ?',
      [userId, x, y]
    );
    
    return result.changes > 0;
  }

  async clearForUser(userId: string): Promise<void> {
    await this.db.run('DELETE FROM base_points WHERE user_id = ?', [userId]);
  }
}
