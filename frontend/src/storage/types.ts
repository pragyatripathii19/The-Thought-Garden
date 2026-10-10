import { Thought, GrowthStage } from '../types';

export interface CreateThoughtDTO {
  text: string;
  collectionIds?: string[];
  stage?: GrowthStage;
}

export interface UpdateThoughtDTO {
  text?: string;
  collectionIds?: string[];
  stage?: GrowthStage;
}

/**
 * Storage contract for Thought entity operations.
 * Concrete adapters (IndexedDB, In-Memory, Postgres / REST API)
 * must implement this contract.
 */
export interface IThoughtRepository {
  create(dto: CreateThoughtDTO): Promise<Thought>;
  getById(id: string): Promise<Thought | null>;
  getAll(): Promise<Thought[]>;
  update(id: string, dto: UpdateThoughtDTO): Promise<Thought>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

export type StorageProviderType = 'indexeddb' | 'memory' | 'postgres';

export interface StorageConfig {
  provider: StorageProviderType;
}
