import { Collection } from '../../types';
import { CreateCollectionDTO, ICollectionRepository, UpdateCollectionDTO } from '../types';
import { getDatabase } from './database';

export class IndexedDBCollectionRepository implements ICollectionRepository {
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
      colorVariant: dto.colorVariant,
      iconType: dto.iconType,
      ...(dto.origin ? { origin: dto.origin } : {}),
      ...(dto.autoReason ? { autoReason: dto.autoReason } : {}),
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    await db.add('collections', collection);
    return collection;
  }

  async getById(id: string): Promise<Collection | null> {
    const db = await getDatabase();
    const collection = await db.get('collections', id);
    return collection || null;
  }

  async getAll(): Promise<Collection[]> {
    const db = await getDatabase();
    const list = (await db.getAll('collections')).reverse();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, dto: UpdateCollectionDTO): Promise<Collection> {
    const db = await getDatabase();
    const existing = await db.get('collections', id);
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
      colorVariant: dto.colorVariant !== undefined ? dto.colorVariant : existing.colorVariant,
      iconType: dto.iconType !== undefined ? dto.iconType : existing.iconType,
      isSaved: dto.isSaved !== undefined ? dto.isSaved : existing.isSaved,
      updatedAt: new Date().toISOString(),
    };

    await db.put('collections', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('collections', id);
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    return await db.count('collections');
  }

  async save(collection: Collection): Promise<Collection> {
    const db = await getDatabase();
    await db.put('collections', collection);
    return collection;
  }

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.clear('collections');
  }
}
