import { Connection, ConnectionStatus } from '../../types';
import { CreateConnectionDTO, IConnectionRepository, UpdateConnectionDTO } from '../types';
import { getDatabase } from './database';

export class IndexedDBConnectionRepository implements IConnectionRepository {
  async create(dto: CreateConnectionDTO): Promise<Connection> {
    if (dto.sourceThoughtId === dto.targetThoughtId) {
      throw new Error('Cannot connect a thought to itself');
    }

    const existing = await this.findPair(dto.sourceThoughtId, dto.targetThoughtId);
    if (existing) {
      return await this.update(existing.id, {
        status: dto.status,
        reason: dto.reason,
        score: dto.score,
      });
    }

    const now = new Date().toISOString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'conn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const connection: Connection = {
      id,
      sourceThoughtId: dto.sourceThoughtId,
      targetThoughtId: dto.targetThoughtId,
      status: dto.status,
      score: dto.score,
      reason: dto.reason,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    await db.add('connections', connection);
    return connection;
  }

  async getById(id: string): Promise<Connection | null> {
    const db = await getDatabase();
    const conn = await db.get('connections', id);
    return conn || null;
  }

  async getAll(): Promise<Connection[]> {
    const db = await getDatabase();
    const list = (await db.getAll('connections')).reverse();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByStatus(status: ConnectionStatus): Promise<Connection[]> {
    const db = await getDatabase();
    const list = await db.getAllFromIndex('connections', 'by-status', status);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findPair(sourceId: string, targetId: string): Promise<Connection | null> {
    const db = await getDatabase();
    const all = await db.getAll('connections');
    for (const conn of all) {
      const matchForward = conn.sourceThoughtId === sourceId && conn.targetThoughtId === targetId;
      const matchReverse = conn.sourceThoughtId === targetId && conn.targetThoughtId === sourceId;
      if (matchForward || matchReverse) {
        return conn;
      }
    }
    return null;
  }

  async update(id: string, dto: UpdateConnectionDTO): Promise<Connection> {
    const db = await getDatabase();
    const existing = await db.get('connections', id);
    if (!existing) {
      throw new Error(`Connection not found with id: ${id}`);
    }

    const updated: Connection = {
      ...existing,
      status: dto.status !== undefined ? dto.status : existing.status,
      score: dto.score !== undefined ? dto.score : existing.score,
      reason: dto.reason !== undefined ? dto.reason : existing.reason,
      updatedAt: new Date().toISOString(),
    };

    await db.put('connections', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('connections', id);
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    return await db.count('connections');
  }

  async save(connection: Connection): Promise<Connection> {
    const db = await getDatabase();
    await db.put('connections', connection);
    return connection;
  }

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.clear('connections');
  }
}
