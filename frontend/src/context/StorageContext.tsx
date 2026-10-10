import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Thought, Collection } from '../types';
import {
  getThoughtRepository,
  getCollectionRepository,
  IThoughtRepository,
  ICollectionRepository,
} from '../storage';

interface StorageContextValue {
  thoughts: Thought[];
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  // Thought actions
  createThought: (text: string) => Promise<Thought>;
  updateThought: (id: string, updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds'>>) => Promise<Thought>;
  deleteThought: (id: string) => Promise<void>;
  refreshThoughts: () => Promise<void>;
  toggleThoughtCollection: (thoughtId: string, collectionId: string) => Promise<Thought>;
  // Collection actions
  createCollection: (name: string, description?: string) => Promise<Collection>;
  updateCollection: (id: string, updates: { name?: string; description?: string }) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;
  refreshCollections: () => Promise<void>;
  // Repositories
  thoughtRepository: IThoughtRepository;
  collectionRepository: ICollectionRepository;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export interface StorageProviderProps {
  children: React.ReactNode;
  thoughtRepository?: IThoughtRepository;
  collectionRepository?: ICollectionRepository;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({
  children,
  thoughtRepository = getThoughtRepository(),
  collectionRepository = getCollectionRepository(),
}) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshThoughts = useCallback(async () => {
    try {
      setError(null);
      const list = await thoughtRepository.getAll();
      setThoughts(list);
    } catch (err) {
      console.error('Failed to load thoughts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load thoughts');
    }
  }, [thoughtRepository]);

  const refreshCollections = useCallback(async () => {
    try {
      setError(null);
      const list = await collectionRepository.getAll();
      setCollections(list);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    }
  }, [collectionRepository]);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([refreshThoughts(), refreshCollections()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshThoughts, refreshCollections]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const createThought = useCallback(
    async (text: string): Promise<Thought> => {
      try {
        setError(null);
        const newThought = await thoughtRepository.create({ text });
        setThoughts((prev) => [newThought, ...prev]);
        return newThought;
      } catch (err) {
        console.error('Failed to create thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to save thought';
        setError(msg);
        throw err;
      }
    },
    [thoughtRepository]
  );

  const updateThought = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds'>>
    ): Promise<Thought> => {
      try {
        setError(null);
        const updated = await thoughtRepository.update(id, updates);
        setThoughts((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        console.error('Failed to update thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to update thought';
        setError(msg);
        throw err;
      }
    },
    [thoughtRepository]
  );

  const deleteThought = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await thoughtRepository.delete(id);
        setThoughts((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error('Failed to delete thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to delete thought';
        setError(msg);
        throw err;
      }
    },
    [thoughtRepository]
  );

  const toggleThoughtCollection = useCallback(
    async (thoughtId: string, collectionId: string): Promise<Thought> => {
      const thought = thoughts.find((t) => t.id === thoughtId);
      if (!thought) {
        throw new Error('Thought not found');
      }

      const existingCollections = thought.collectionIds || [];
      const hasCollection = existingCollections.includes(collectionId);
      const updatedCollectionIds = hasCollection
        ? existingCollections.filter((id) => id !== collectionId)
        : [...existingCollections, collectionId];

      return await updateThought(thoughtId, { collectionIds: updatedCollectionIds });
    },
    [thoughts, updateThought]
  );

  const createCollection = useCallback(
    async (name: string, description?: string): Promise<Collection> => {
      try {
        setError(null);
        const newCollection = await collectionRepository.create({ name, description });
        setCollections((prev) => [newCollection, ...prev]);
        return newCollection;
      } catch (err) {
        console.error('Failed to create collection:', err);
        const msg = err instanceof Error ? err.message : 'Failed to create collection';
        setError(msg);
        throw err;
      }
    },
    [collectionRepository]
  );

  const updateCollection = useCallback(
    async (id: string, updates: { name?: string; description?: string }): Promise<Collection> => {
      try {
        setError(null);
        const updated = await collectionRepository.update(id, updates);
        setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (err) {
        console.error('Failed to update collection:', err);
        const msg = err instanceof Error ? err.message : 'Failed to update collection';
        setError(msg);
        throw err;
      }
    },
    [collectionRepository]
  );

  const deleteCollection = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        // 1. Delete collection from repository
        await collectionRepository.delete(id);
        setCollections((prev) => prev.filter((c) => c.id !== id));

        // 2. Unlink collection from all thoughts that belong to it (ensuring thoughts are NEVER deleted)
        const affectedThoughts = thoughts.filter((t) => t.collectionIds?.includes(id));
        for (const t of affectedThoughts) {
          const cleaned = t.collectionIds.filter((cid) => cid !== id);
          await thoughtRepository.update(t.id, { collectionIds: cleaned });
        }

        // Refresh thoughts list in state
        if (affectedThoughts.length > 0) {
          setThoughts((prev) =>
            prev.map((t) =>
              t.collectionIds?.includes(id)
                ? { ...t, collectionIds: t.collectionIds.filter((cid) => cid !== id) }
                : t
            )
          );
        }
      } catch (err) {
        console.error('Failed to delete collection:', err);
        const msg = err instanceof Error ? err.message : 'Failed to delete collection';
        setError(msg);
        throw err;
      }
    },
    [collectionRepository, thoughtRepository, thoughts]
  );

  return (
    <StorageContext.Provider
      value={{
        thoughts,
        collections,
        isLoading,
        error,
        createThought,
        updateThought,
        deleteThought,
        refreshThoughts,
        toggleThoughtCollection,
        createCollection,
        updateCollection,
        deleteCollection,
        refreshCollections,
        thoughtRepository,
        collectionRepository,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export function useThoughts(): StorageContextValue {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useThoughts must be used within a StorageProvider');
  }
  return context;
}
