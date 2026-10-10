import { Thought, Collection, Connection, ConnectionStatus, GrowthStage } from '../types';

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
  save(thought: Thought): Promise<Thought>;
  clear(): Promise<void>;
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
  save(collection: Collection): Promise<Collection>;
  clear(): Promise<void>;
}

export interface CreateConnectionDTO {
  sourceThoughtId: string;
  targetThoughtId: string;
  status: ConnectionStatus;
  score?: number;
  reason: string;
}

export interface UpdateConnectionDTO {
  status?: ConnectionStatus;
  score?: number;
  reason?: string;
}

/**
 * Storage contract for Connection entity operations.
 * Concrete adapters (IndexedDB, In-Memory, Postgres / REST API)
 * must implement this contract.
 */
export interface IConnectionRepository {
  create(dto: CreateConnectionDTO): Promise<Connection>;
  getById(id: string): Promise<Connection | null>;
  getAll(): Promise<Connection[]>;
  getByStatus(status: ConnectionStatus): Promise<Connection[]>;
  update(id: string, dto: UpdateConnectionDTO): Promise<Connection>;
  delete(id: string): Promise<void>;
  findPair(sourceId: string, targetId: string): Promise<Connection | null>;
  count(): Promise<number>;
  save(connection: Connection): Promise<Connection>;
  clear(): Promise<void>;
}

export type StorageProviderType = 'indexeddb' | 'memory' | 'postgres';

export interface StorageConfig {
  provider: StorageProviderType;
}
