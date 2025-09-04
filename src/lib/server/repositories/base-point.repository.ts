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
    // First, try to get the existing base point
    const existing = await this.db.get<BasePoint>(
      'SELECT id, x, y, created_at_ms as createdAtMs FROM base_points WHERE user_id = ? AND x = ? AND y = ?',
      [userId, x, y]
    );

    if (existing) {
      return existing;
    }

    // If it doesn't exist, insert a new one
    const now = Date.now();
    const result = await this.db.run(
      'INSERT INTO base_points (user_id, x, y, created_at_ms, updated_at_ms) VALUES (?, ?, ?, ?, ?)',
      [userId, x, y, now, now]
    );
    
    return {
      id: result.lastID!,
      x,
      y,
      userId,
      createdAtMs: now
    };
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
