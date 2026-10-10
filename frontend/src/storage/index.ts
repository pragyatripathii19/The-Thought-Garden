import { IThoughtRepository, StorageProviderType } from './types';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { IndexedDBThoughtRepository } from './indexeddb/IndexedDBThoughtRepository';

let repositoryInstance: IThoughtRepository | null = null;
let currentProvider: StorageProviderType = 'indexeddb';

/**
 * Factory function to retrieve or configure the thought repository.
 * Swapping between IndexedDB, In-Memory, or future PostgreSQL/REST API
 * only requires changing the provider type here.
 */
export function getThoughtRepository(provider: StorageProviderType = currentProvider): IThoughtRepository {
  if (!repositoryInstance || currentProvider !== provider) {
    currentProvider = provider;
    switch (provider) {
      case 'memory':
        repositoryInstance = new InMemoryThoughtRepository();
        break;
      case 'indexeddb':
        repositoryInstance = new IndexedDBThoughtRepository();
        break;
      case 'postgres':
        // Future adapter: e.g. new PostgresThoughtRepository()
        throw new Error('PostgreSQL adapter not yet implemented. Set provider to "indexeddb" or "memory".');
      default:
        repositoryInstance = new IndexedDBThoughtRepository();
    }
  }
  return repositoryInstance;
}

/**
 * Helper to override repository during tests or custom environments
 */
export function setThoughtRepository(customRepo: IThoughtRepository): void {
  repositoryInstance = customRepo;
}

export * from './types';
export { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
export { IndexedDBThoughtRepository } from './indexeddb/IndexedDBThoughtRepository';
