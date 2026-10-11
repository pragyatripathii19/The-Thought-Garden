import { ThoughtEmbedding } from '../../types';
import { IEmbeddingRepository } from '../types';
import { getDatabase } from './database';

export class IndexedDBEmbeddingRepository implements IEmbeddingRepository {
  async get(thoughtId: string): Promise<ThoughtEmbedding | null> {
    const db = await getDatabase();
    return (await db.get('embeddings', thoughtId)) || null;
  }

  async getAll(): Promise<ThoughtEmbedding[]> {
    const db = await getDatabase();
    return db.getAll('embeddings');
  }

  async put(embedding: ThoughtEmbedding): Promise<ThoughtEmbedding> {
    const db = await getDatabase();
    await db.put('embeddings', embedding);
    return embedding;
  }

  async delete(thoughtId: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('embeddings', thoughtId);
  }

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.clear('embeddings');
  }
}
