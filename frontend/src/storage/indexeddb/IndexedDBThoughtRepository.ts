import { Thought } from '../../types';
import { CreateThoughtDTO, IThoughtRepository, UpdateThoughtDTO, applyThoughtUpdate } from '../types';
import { getDatabase } from './database';

export class IndexedDBThoughtRepository implements IThoughtRepository {
  async create(dto: CreateThoughtDTO): Promise<Thought> {
    const trimmed = dto.text.trim();
    if (!trimmed) {
      throw new Error('Thought text cannot be empty');
    }

    const now = new Date().toISOString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'thought-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const thought: Thought = {
      id,
      text: dto.text,
      createdAt: now,
      updatedAt: now,
      collectionIds: dto.collectionIds ? [...dto.collectionIds] : [],
      stage: dto.stage || 'seed',
      isSaved: dto.isSaved || false,
      category: dto.category,
      ...(dto.classifyState ? { classifyState: dto.classifyState } : {}),
    };

    const db = await getDatabase();
    await db.add('thoughts', thought);
    return thought;
  }

  async getById(id: string): Promise<Thought | null> {
    const db = await getDatabase();
    const thought = await db.get('thoughts', id);
    return thought || null;
  }

  async getAll(): Promise<Thought[]> {
    const db = await getDatabase();
    // Get all thoughts and sort reverse chronologically (newest first)
    const list = (await db.getAll('thoughts')).reverse();
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, dto: UpdateThoughtDTO): Promise<Thought> {
    const db = await getDatabase();
    const existing = await db.get('thoughts', id);
    if (!existing) {
      throw new Error(`Thought not found with id: ${id}`);
    }

    const updated = applyThoughtUpdate(existing, dto);
    await db.put('thoughts', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('thoughts', id);
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    return await db.count('thoughts');
  }

  async save(thought: Thought): Promise<Thought> {
    const db = await getDatabase();
    await db.put('thoughts', thought);
    return thought;
  }

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.clear('thoughts');
  }
}
