import { ThoughtEmbedding } from '../../types';
import { IEmbeddingRepository } from '../types';

export class InMemoryEmbeddingRepository implements IEmbeddingRepository {
  private embeddings: Map<string, ThoughtEmbedding> = new Map();

  async get(thoughtId: string): Promise<ThoughtEmbedding | null> {
    const item = this.embeddings.get(thoughtId);
    return item ? { ...item, vector: [...item.vector] } : null;
  }

  async getAll(): Promise<ThoughtEmbedding[]> {
    return Array.from(this.embeddings.values()).map((e) => ({ ...e, vector: [...e.vector] }));
  }

  async put(embedding: ThoughtEmbedding): Promise<ThoughtEmbedding> {
    this.embeddings.set(embedding.thoughtId, { ...embedding, vector: [...embedding.vector] });
    return embedding;
  }

  async delete(thoughtId: string): Promise<void> {
    this.embeddings.delete(thoughtId);
  }

  async clear(): Promise<void> {
    this.embeddings.clear();
  }
}
