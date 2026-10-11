import { Thought } from '../../types';
import { CreateThoughtDTO, IThoughtRepository, UpdateThoughtDTO, applyThoughtUpdate } from '../types';

export class InMemoryThoughtRepository implements IThoughtRepository {
  private thoughts: Map<string, Thought> = new Map();

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

    this.thoughts.set(id, thought);
    return { ...thought };
  }

  async getById(id: string): Promise<Thought | null> {
    const item = this.thoughts.get(id);
    return item ? { ...item } : null;
  }

  async getAll(): Promise<Thought[]> {
    const list = Array.from(this.thoughts.values()).reverse();
    // Reverse chronological order (newest first)
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, dto: UpdateThoughtDTO): Promise<Thought> {
    const existing = this.thoughts.get(id);
    if (!existing) {
      throw new Error(`Thought not found with id: ${id}`);
    }

    const updated = applyThoughtUpdate(existing, dto);
    this.thoughts.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.thoughts.delete(id);
  }

  async count(): Promise<number> {
    return this.thoughts.size;
  }

  async save(thought: Thought): Promise<Thought> {
    this.thoughts.set(thought.id, { ...thought });
    return { ...thought };
  }

  async clear(): Promise<void> {
    this.thoughts.clear();
  }
}
