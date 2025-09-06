import { Database } from 'sqlite';
import { BaseRepository } from '../base-repository';

export interface UserItem {
  id?: number;
  user_id: string;
  data: string;
  created_at_ms?: number;
}

export class UserItemRepository extends BaseRepository<UserItem> {
  constructor(db: Database) {
    super(db, 'user_items');
  }

  protected mapToModel(row: any): UserItem {
    return {
      id: row.id,
      user_id: row.user_id,
      data: row.data,
      created_at_ms: row.created_at_ms,
    };
  }

  protected validate(entity: Partial<UserItem>): void {
    if (!entity.user_id) throw new Error('User ID is required');
    if (!entity.data) throw new Error('Data is required');
  }

  async findByUserId(userId: string): Promise<UserItem[]> {
    return this.findMany({ user_id: userId });
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.db.run(
      `DELETE FROM ${this.tableName} WHERE user_id = ?`,
      [userId]
    );
    return result.changes || 0;
  }
}
