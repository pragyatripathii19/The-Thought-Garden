import { Connection, ConnectionStatus } from '../../types';
import { CreateConnectionDTO, IConnectionRepository, UpdateConnectionDTO } from '../types';

export class InMemoryConnectionRepository implements IConnectionRepository {
  private connections: Map<string, Connection> = new Map();

  async create(dto: CreateConnectionDTO): Promise<Connection> {
    if (dto.sourceThoughtId === dto.targetThoughtId) {
      throw new Error('Cannot connect a thought to itself');
    }

    const existing = await this.findPair(dto.sourceThoughtId, dto.targetThoughtId);
    if (existing) {
      // If pair exists, update it rather than creating duplicate
      return await this.update(existing.id, {
        status: dto.status,
        reason: dto.reason,
        score: dto.score,
        kind: dto.kind,
        subject: dto.subject,
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
      kind: dto.kind,
      subject: dto.subject,
      createdAt: now,
      updatedAt: now,
    };

    this.connections.set(id, connection);
    return { ...connection };
  }

  async getById(id: string): Promise<Connection | null> {
    const item = this.connections.get(id);
    return item ? { ...item } : null;
  }

  async getAll(): Promise<Connection[]> {
    const list = Array.from(this.connections.values()).reverse();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByStatus(status: ConnectionStatus): Promise<Connection[]> {
    const list = await this.getAll();
    return list.filter((c) => c.status === status);
  }

  async findPair(sourceId: string, targetId: string): Promise<Connection | null> {
    for (const conn of this.connections.values()) {
      const matchForward = conn.sourceThoughtId === sourceId && conn.targetThoughtId === targetId;
      const matchReverse = conn.sourceThoughtId === targetId && conn.targetThoughtId === sourceId;
      if (matchForward || matchReverse) {
        return { ...conn };
      }
    }
    return null;
  }

  async update(id: string, dto: UpdateConnectionDTO): Promise<Connection> {
    const existing = this.connections.get(id);
    if (!existing) {
      throw new Error(`Connection not found with id: ${id}`);
    }

    const updated: Connection = {
      ...existing,
      status: dto.status !== undefined ? dto.status : existing.status,
      score: dto.score !== undefined ? dto.score : existing.score,
      reason: dto.reason !== undefined ? dto.reason : existing.reason,
      kind: dto.kind !== undefined ? dto.kind : existing.kind,
      subject: dto.subject !== undefined ? dto.subject : existing.subject,
      updatedAt: new Date().toISOString(),
    };

    this.connections.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.connections.delete(id);
  }

  async count(): Promise<number> {
    return this.connections.size;
  }

  async save(connection: Connection): Promise<Connection> {
    this.connections.set(connection.id, { ...connection });
    return { ...connection };
  }

  async clear(): Promise<void> {
    this.connections.clear();
  }
}
