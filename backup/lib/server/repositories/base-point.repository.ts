import { Database } from 'sqlite';
import { BasePoint } from '../../types/board';

export class BasePointRepository {
  constructor(private db: Database) {}

  async getByUser(userId: string): Promise<BasePoint[]> {
    return this.db.all<BasePoint>(
      'SELECT id, x, y, created_at_ms as createdAtMs FROM base_points WHERE user_id = ?',
      [userId]
    );
  }

  async add(userId: string, x: number, y: number): Promise<BasePoint> {
    const result = await this.db.run(
      'INSERT INTO base_points (user_id, x, y) VALUES (?, ?, ?) ON CONFLICT(user_id, x, y) DO UPDATE SET updated_at_ms = (strftime(\"%s\", \"now\") * 1000) RETURNING *',
      [userId, x, y]
    );
    
    return {
      id: result.lastID!,
      x,
      y,
      userId,
      createdAtMs: Date.now()
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
