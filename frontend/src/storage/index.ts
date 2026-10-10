import { IThoughtRepository, ICollectionRepository, StorageProviderType } from './types';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { IndexedDBThoughtRepository } from './indexeddb/IndexedDBThoughtRepository';
import { InMemoryCollectionRepository } from './memory/InMemoryCollectionRepository';
import { IndexedDBCollectionRepository } from './indexeddb/IndexedDBCollectionRepository';

let thoughtRepoInstance: IThoughtRepository | null = null;
let collectionRepoInstance: ICollectionRepository | null = null;
let currentProvider: StorageProviderType = 'indexeddb';

/**
 * Factory function to retrieve or configure the thought repository.
 * Swapping between IndexedDB, In-Memory, or future PostgreSQL/REST API
 * only requires changing the provider type here.
 */
export function getThoughtRepository(provider: StorageProviderType = currentProvider): IThoughtRepository {
  if (!thoughtRepoInstance || currentProvider !== provider) {
    currentProvider = provider;
    switch (provider) {
      case 'memory':
        thoughtRepoInstance = new InMemoryThoughtRepository();
        break;
      case 'indexeddb':
        thoughtRepoInstance = new IndexedDBThoughtRepository();
        break;
      case 'postgres':
        throw new Error('PostgreSQL adapter not yet implemented. Set provider to "indexeddb" or "memory".');
      default:
        thoughtRepoInstance = new IndexedDBThoughtRepository();
    }
  }
  return thoughtRepoInstance;
}

export function setThoughtRepository(customRepo: IThoughtRepository): void {
  thoughtRepoInstance = customRepo;
}

/**
 * Factory function to retrieve or configure the collection repository.
 */
export function getCollectionRepository(provider: StorageProviderType = currentProvider): ICollectionRepository {
  if (!collectionRepoInstance || currentProvider !== provider) {
    currentProvider = provider;
    switch (provider) {
      case 'memory':
        collectionRepoInstance = new InMemoryCollectionRepository();
        break;
      case 'indexeddb':
        collectionRepoInstance = new IndexedDBCollectionRepository();
        break;
      case 'postgres':
        throw new Error('PostgreSQL adapter not yet implemented. Set provider to "indexeddb" or "memory".');
      default:
        collectionRepoInstance = new IndexedDBCollectionRepository();
    }
  }
  return collectionRepoInstance;
}

export function setCollectionRepository(customRepo: ICollectionRepository): void {
  collectionRepoInstance = customRepo;
}

export * from './types';
export { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
export { IndexedDBThoughtRepository } from './indexeddb/IndexedDBThoughtRepository';
export { InMemoryCollectionRepository } from './memory/InMemoryCollectionRepository';
export { IndexedDBCollectionRepository } from './indexeddb/IndexedDBCollectionRepository';
