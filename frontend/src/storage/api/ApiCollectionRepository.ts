import { Collection } from '../../types';
import { apiFetch } from '../../lib/api';
import { CreateCollectionDTO, ICollectionRepository, UpdateCollectionDTO } from '../types';
import { newId } from './newId';

/** Collections stored on the server for the signed-in user. */
export class ApiCollectionRepository implements ICollectionRepository {
  private cache = new Map<string, Collection>();

  async create(dto: CreateCollectionDTO): Promise<Collection> {
    const trimmed = dto.name.trim();
    if (!trimmed) {
      throw new Error('Collection name cannot be empty');
    }
    const now = new Date().toISOString();
    return this.save({
      id: newId('col'),
      name: trimmed,
      description: dto.description?.trim() || undefined,
      colorVariant: dto.colorVariant,
      iconType: dto.iconType,
      ...(dto.origin ? { origin: dto.origin } : {}),
      ...(dto.autoReason ? { autoReason: dto.autoReason } : {}),
      createdAt: now,
      updatedAt: now,
    });
  }

  async getById(id: string): Promise<Collection | null> {
    const cached = this.cache.get(id);
    if (cached) return { ...cached };
    await this.getAll();
    const found = this.cache.get(id);
    return found ? { ...found } : null;
  }

  async getAll(): Promise<Collection[]> {
    const { collections } = await apiFetch<{ collections: Collection[] }>('/collections');
    this.cache = new Map(collections.map((c) => [c.id, c]));
    return collections.map((c) => ({ ...c }));
  }

  async update(id: string, dto: UpdateCollectionDTO): Promise<Collection> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Collection not found with id: ${id}`);
    }
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Collection name cannot be empty');
    }
    return this.save({
      ...existing,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      description: dto.description !== undefined ? dto.description.trim() || undefined : existing.description,
      colorVariant: dto.colorVariant !== undefined ? dto.colorVariant : existing.colorVariant,
      iconType: dto.iconType !== undefined ? dto.iconType : existing.iconType,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await apiFetch(`/collections/${encodeURIComponent(id)}`, { method: 'DELETE' });
    this.cache.delete(id);
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  async save(collection: Collection): Promise<Collection> {
    const { collection: saved } = await apiFetch<{ collection: Collection }>(
      `/collections/${encodeURIComponent(collection.id)}`,
      { method: 'PUT', body: collection }
    );
    this.cache.set(saved.id, saved);
    return { ...saved };
  }

  async clear(): Promise<void> {
    await apiFetch('/collections', { method: 'DELETE' });
    this.cache.clear();
  }
}
