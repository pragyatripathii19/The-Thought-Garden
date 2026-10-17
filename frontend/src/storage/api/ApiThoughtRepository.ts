import { Thought } from '../../types';
import { apiFetch } from '../../lib/api';
import { CreateThoughtDTO, IThoughtRepository, UpdateThoughtDTO, applyThoughtUpdate } from '../types';
import { newId } from './newId';

/**
 * Thoughts stored on the server for the signed-in user. Changes are computed
 * here with the same helpers as the local repositories, then saved whole; the
 * cache mirrors the last list fetched so an update needs one request.
 */
export class ApiThoughtRepository implements IThoughtRepository {
  private cache = new Map<string, Thought>();

  async create(dto: CreateThoughtDTO): Promise<Thought> {
    if (!dto.text.trim()) {
      throw new Error('Thought text cannot be empty');
    }
    const now = new Date().toISOString();
    return this.save({
      id: newId('thought'),
      text: dto.text,
      createdAt: now,
      updatedAt: now,
      collectionIds: dto.collectionIds ? [...dto.collectionIds] : [],
      stage: dto.stage || 'seed',
      isSaved: dto.isSaved || false,
      category: dto.category,
      ...(dto.classifyState ? { classifyState: dto.classifyState } : {}),
    });
  }

  async getById(id: string): Promise<Thought | null> {
    const cached = this.cache.get(id);
    if (cached) return { ...cached };
    await this.getAll();
    const found = this.cache.get(id);
    return found ? { ...found } : null;
  }

  async getAll(): Promise<Thought[]> {
    const { thoughts } = await apiFetch<{ thoughts: Thought[] }>('/thoughts');
    this.cache = new Map(thoughts.map((t) => [t.id, t]));
    return thoughts.map((t) => ({ ...t }));
  }

  async update(id: string, dto: UpdateThoughtDTO): Promise<Thought> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Thought not found with id: ${id}`);
    }
    return this.save(applyThoughtUpdate(existing, dto));
  }

  async delete(id: string): Promise<void> {
    await apiFetch(`/thoughts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    this.cache.delete(id);
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  async save(thought: Thought): Promise<Thought> {
    const { thought: saved } = await apiFetch<{ thought: Thought }>(`/thoughts/${encodeURIComponent(thought.id)}`, {
      method: 'PUT',
      body: thought,
    });
    this.cache.set(saved.id, saved);
    return { ...saved };
  }

  async clear(): Promise<void> {
    await apiFetch('/thoughts', { method: 'DELETE' });
    this.cache.clear();
  }
}
