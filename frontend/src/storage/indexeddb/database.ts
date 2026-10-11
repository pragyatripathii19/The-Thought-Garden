import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Thought, Collection, Connection, ThoughtEmbedding, OrganizeEvent } from '../../types';

export const DB_NAME = 'ThoughtGardenDB';
// v2: adds `embeddings` and `organizeEvents` stores for automatic organising.
export const DB_VERSION = 2;

export interface ThoughtGardenSchema extends DBSchema {
  thoughts: {
    key: string;
    value: Thought;
    indexes: {
      'by-createdAt': string;
    };
  };
  collections: {
    key: string;
    value: Collection;
    indexes: {
      'by-createdAt': string;
    };
  };
  connections: {
    key: string;
    value: Connection;
    indexes: {
      'by-source': string;
      'by-target': string;
      'by-status': string;
    };
  };
  embeddings: {
    key: string;
    value: ThoughtEmbedding;
  };
  organizeEvents: {
    key: string;
    value: OrganizeEvent;
    indexes: {
      'by-createdAt': string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ThoughtGardenSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<ThoughtGardenSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<ThoughtGardenSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Thoughts store
        if (!db.objectStoreNames.contains('thoughts')) {
          const thoughtStore = db.createObjectStore('thoughts', { keyPath: 'id' });
          thoughtStore.createIndex('by-createdAt', 'createdAt');
        }

        // Collections store (for Piece 4)
        if (!db.objectStoreNames.contains('collections')) {
          const collectionStore = db.createObjectStore('collections', { keyPath: 'id' });
          collectionStore.createIndex('by-createdAt', 'createdAt');
        }

        // Connections store (for Piece 5)
        if (!db.objectStoreNames.contains('connections')) {
          const connectionStore = db.createObjectStore('connections', { keyPath: 'id' });
          connectionStore.createIndex('by-source', 'sourceThoughtId');
          connectionStore.createIndex('by-target', 'targetThoughtId');
          connectionStore.createIndex('by-status', 'status');
        }

        // Embeddings store (v2, automatic organising)
        if (!db.objectStoreNames.contains('embeddings')) {
          db.createObjectStore('embeddings', { keyPath: 'thoughtId' });
        }

        // Organiser activity log (v2)
        if (!db.objectStoreNames.contains('organizeEvents')) {
          const eventStore = db.createObjectStore('organizeEvents', { keyPath: 'id' });
          eventStore.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}
