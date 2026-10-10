import { Thought, Collection, GrowthStage } from '../types';

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

export interface CreateCollectionDTO {
  name: string;
  description?: string;
}

export interface UpdateCollectionDTO {
  name?: string;
  description?: string;
}

/**
 * Storage contract for Collection entity operations.
 * Concrete adapters (IndexedDB, In-Memory, Postgres / REST API)
 * must implement this contract.
 */
export interface ICollectionRepository {
  create(dto: CreateCollectionDTO): Promise<Collection>;
  getById(id: string): Promise<Collection | null>;
  getAll(): Promise<Collection[]>;
  update(id: string, dto: UpdateCollectionDTO): Promise<Collection>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

export type StorageProviderType = 'indexeddb' | 'memory' | 'postgres';

export interface StorageConfig {
  provider: StorageProviderType;
}
