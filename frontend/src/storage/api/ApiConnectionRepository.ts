import { Connection, ConnectionStatus } from '../../types';
import { apiFetch } from '../../lib/api';
import { CreateConnectionDTO, IConnectionRepository, UpdateConnectionDTO } from '../types';
import { newId } from './newId';

/** Connections stored on the server for the signed-in user. */
export class ApiConnectionRepository implements IConnectionRepository {
  private cache = new Map<string, Connection>();

  async create(dto: CreateConnectionDTO): Promise<Connection> {
    if (dto.sourceThoughtId === dto.targetThoughtId) {
      throw new Error('Cannot connect a thought to itself');
    }
    const existing = await this.findPair(dto.sourceThoughtId, dto.targetThoughtId);
    if (existing) {
      // If the pair exists, update it rather than creating a duplicate.
      return this.update(existing.id, { status: dto.status, reason: dto.reason, score: dto.score });
    }
    const now = new Date().toISOString();
    return this.save({
      id: newId('conn'),
      sourceThoughtId: dto.sourceThoughtId,
      targetThoughtId: dto.targetThoughtId,
      status: dto.status,
      score: dto.score,
      reason: dto.reason,
      createdAt: now,
      updatedAt: now,
    });
  }

  async getById(id: string): Promise<Connection | null> {
    const cached = this.cache.get(id);
    if (cached) return { ...cached };
    await this.getAll();
    const found = this.cache.get(id);
    return found ? { ...found } : null;
  }

  async getAll(): Promise<Connection[]> {
    const { connections } = await apiFetch<{ connections: Connection[] }>('/connections');
    this.cache = new Map(connections.map((c) => [c.id, c]));
    return connections.map((c) => ({ ...c }));
  }

  async getByStatus(status: ConnectionStatus): Promise<Connection[]> {
    return (await this.getAll()).filter((c) => c.status === status);
  }

  async findPair(sourceId: string, targetId: string): Promise<Connection | null> {
    for (const conn of this.cache.values()) {
      const forward = conn.sourceThoughtId === sourceId && conn.targetThoughtId === targetId;
      const reverse = conn.sourceThoughtId === targetId && conn.targetThoughtId === sourceId;
      if (forward || reverse) return { ...conn };
    }
    return null;
  }

  async update(id: string, dto: UpdateConnectionDTO): Promise<Connection> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Connection not found with id: ${id}`);
    }
    return this.save({
      ...existing,
      status: dto.status !== undefined ? dto.status : existing.status,
      score: dto.score !== undefined ? dto.score : existing.score,
      reason: dto.reason !== undefined ? dto.reason : existing.reason,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await apiFetch(`/connections/${encodeURIComponent(id)}`, { method: 'DELETE' });
    this.cache.delete(id);
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  async save(connection: Connection): Promise<Connection> {
    const { connection: saved } = await apiFetch<{ connection: Connection }>(
      `/connections/${encodeURIComponent(connection.id)}`,
      { method: 'PUT', body: connection }
    );
    this.cache.set(saved.id, saved);
    return { ...saved };
  }

  async clear(): Promise<void> {
    await apiFetch('/connections', { method: 'DELETE' });
    this.cache.clear();
  }
}
