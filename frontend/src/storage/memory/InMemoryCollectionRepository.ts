import { Collection } from '../../types';
import { CreateCollectionDTO, ICollectionRepository, UpdateCollectionDTO } from '../types';

export class InMemoryCollectionRepository implements ICollectionRepository {
  private collections: Map<string, Collection> = new Map();

  async create(dto: CreateCollectionDTO): Promise<Collection> {
    const trimmed = dto.name.trim();
    if (!trimmed) {
      throw new Error('Collection name cannot be empty');
    }

    const now = new Date().toISOString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'col-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const collection: Collection = {
      id,
      name: trimmed,
      description: dto.description?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.collections.set(id, collection);
    return { ...collection };
  }

  async getById(id: string): Promise<Collection | null> {
    const item = this.collections.get(id);
    return item ? { ...item } : null;
  }

  async getAll(): Promise<Collection[]> {
    const list = Array.from(this.collections.values()).reverse();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, dto: UpdateCollectionDTO): Promise<Collection> {
    const existing = this.collections.get(id);
    if (!existing) {
      throw new Error(`Collection not found with id: ${id}`);
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Collection name cannot be empty');
    }

    const updated: Collection = {
      ...existing,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      description: dto.description !== undefined ? dto.description.trim() || undefined : existing.description,
      updatedAt: new Date().toISOString(),
    };

    this.collections.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.collections.delete(id);
  }

  async count(): Promise<number> {
    return this.collections.size;
  }

  clear(): void {
    this.collections.clear();
  }
}
