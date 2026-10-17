import {
  Thought,
  Collection,
  Connection,
  ConnectionStatus,
  GrowthStage,
  ThoughtCategory,
  CollectionColorVariant,
  CollectionIconType,
  CollectionOrigin,
  ClassifyState,
  ThoughtEmbedding,
  OrganizeEvent,
} from '../types';

export interface CreateThoughtDTO {
  text: string;
  collectionIds?: string[];
  stage?: GrowthStage;
  isSaved?: boolean;
  category?: ThoughtCategory;
  classifyState?: ClassifyState;
}

export interface UpdateThoughtDTO {
  text?: string;
  collectionIds?: string[];
  stage?: GrowthStage;
  isSaved?: boolean;
  category?: ThoughtCategory;
  autoCollectionIds?: string[];
  organizeLocked?: boolean;
  classifyState?: ClassifyState;
  classifiedAt?: string;
  /** Turn automatic growth back on (false) or off (true) without changing the stage. */
  stageManual?: boolean;
  /** A stage reached automatically. Unlike `stage`, it isn't the user's choice and isn't "tending". */
  evolvedStage?: GrowthStage;
}

/**
 * Applies an update DTO to a thought. Shared by every thought repository so
 * adapters stay consistent. Only user-visible changes refresh `updatedAt`;
 * organiser bookkeeping (classifyState etc.) does not count as "tending".
 */
export function applyThoughtUpdate(existing: Thought, dto: UpdateThoughtDTO): Thought {
  if (dto.text !== undefined && !dto.text.trim()) {
    throw new Error('Thought text cannot be empty');
  }

  const touchesContent =
    dto.text !== undefined ||
    dto.collectionIds !== undefined ||
    dto.stage !== undefined ||
    dto.isSaved !== undefined ||
    dto.category !== undefined;

  const updated: Thought = { ...existing };
  if (dto.text !== undefined && dto.text !== existing.text) updated.editCount = (existing.editCount || 0) + 1;
  if (dto.text !== undefined) updated.text = dto.text;
  if (dto.collectionIds !== undefined) updated.collectionIds = [...dto.collectionIds];
  if (dto.stage !== undefined) {
    // A stage set directly is the user's choice: automatic growth stops for this thought.
    updated.stage = dto.stage;
    updated.stageManual = true;
  }
  if (dto.stageManual !== undefined) updated.stageManual = dto.stageManual;
  if (dto.evolvedStage !== undefined) updated.stage = dto.evolvedStage;
  if (dto.isSaved !== undefined) updated.isSaved = dto.isSaved;
  if (dto.category !== undefined) updated.category = dto.category;
  if (dto.autoCollectionIds !== undefined) updated.autoCollectionIds = [...dto.autoCollectionIds];
  if (dto.organizeLocked !== undefined) updated.organizeLocked = dto.organizeLocked;
  if (dto.classifyState !== undefined) updated.classifyState = dto.classifyState;
  if (dto.classifiedAt !== undefined) updated.classifiedAt = dto.classifiedAt;
  if (touchesContent) updated.updatedAt = new Date().toISOString();
  return updated;
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
  colorVariant?: CollectionColorVariant;
  iconType?: CollectionIconType;
  origin?: CollectionOrigin;
  autoReason?: string;
}

export interface UpdateCollectionDTO {
  name?: string;
  description?: string;
  colorVariant?: CollectionColorVariant;
  iconType?: CollectionIconType;
  isSaved?: boolean;
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

/**
 * Storage contract for locally computed thought embeddings (one per thought).
 */
export interface IEmbeddingRepository {
  get(thoughtId: string): Promise<ThoughtEmbedding | null>;
  getAll(): Promise<ThoughtEmbedding[]>;
  put(embedding: ThoughtEmbedding): Promise<ThoughtEmbedding>;
  delete(thoughtId: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Storage contract for the organiser's activity log.
 */
export interface IOrganizeEventRepository {
  add(event: OrganizeEvent): Promise<OrganizeEvent>;
  getAll(): Promise<OrganizeEvent[]>;
  update(id: string, patch: Partial<Pick<OrganizeEvent, 'undoneAt'>>): Promise<OrganizeEvent>;
  clear(): Promise<void>;
}

export type StorageProviderType = 'indexeddb' | 'memory' | 'postgres';

export interface StorageConfig {
  provider: StorageProviderType;
}
