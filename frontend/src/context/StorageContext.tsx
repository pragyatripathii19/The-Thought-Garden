import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Thought, Collection, Connection } from '../types';
import {
  getThoughtRepository,
  getCollectionRepository,
  getConnectionRepository,
  IThoughtRepository,
  ICollectionRepository,
  IConnectionRepository,
} from '../storage';
import { findTopSuggestedConnection, SuggestedConnection } from '../lib/connections';
import { downloadBackupFile, GardenBackupV1, ImportStats } from '../lib/portability';
import { pickThoughtToRevisit } from '../lib/rediscovery';

interface StorageContextValue {
  thoughts: Thought[];
  collections: Collection[];
  connections: Connection[];
  suggestedConnection: SuggestedConnection | null;
  rediscoveredThought: Thought | null;
  isLoading: boolean;
  error: string | null;
  // Thought actions
  createThought: (text: string) => Promise<Thought>;
  updateThought: (id: string, updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds'>>) => Promise<Thought>;
  deleteThought: (id: string) => Promise<void>;
  refreshThoughts: () => Promise<void>;
  toggleThoughtCollection: (thoughtId: string, collectionId: string) => Promise<Thought>;
  dismissRediscoveredThought: (id: string) => void;
  // Collection actions
  createCollection: (name: string, description?: string) => Promise<Collection>;
  updateCollection: (id: string, updates: { name?: string; description?: string }) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;
  refreshCollections: () => Promise<void>;
  // Connection actions
  acceptConnection: (sourceId: string, targetId: string, reason: string) => Promise<Connection>;
  dismissConnection: (sourceId: string, targetId: string) => Promise<Connection>;
  refreshConnections: () => Promise<void>;
  // Portability
  exportBackup: () => void;
  importBackup: (backup: GardenBackupV1, strategy: 'merge' | 'replace') => Promise<ImportStats>;
  // Repositories
  thoughtRepository: IThoughtRepository;
  collectionRepository: ICollectionRepository;
  connectionRepository: IConnectionRepository;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export interface StorageProviderProps {
  children: React.ReactNode;
  thoughtRepository?: IThoughtRepository;
  collectionRepository?: ICollectionRepository;
  connectionRepository?: IConnectionRepository;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({
  children,
  thoughtRepository = getThoughtRepository(),
  collectionRepository = getCollectionRepository(),
  connectionRepository = getConnectionRepository(),
}) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
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

  const refreshConnections = useCallback(async () => {
    try {
      setError(null);
      const list = await connectionRepository.getAll();
      setConnections(list);
    } catch (err) {
      console.error('Failed to load connections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    }
  }, [connectionRepository]);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([refreshThoughts(), refreshCollections(), refreshConnections()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshThoughts, refreshCollections, refreshConnections]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Compute live suggested connection candidate
  const suggestedConnection = useMemo(() => {
    return findTopSuggestedConnection(thoughts, connections);
  }, [thoughts, connections]);

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
        // Also remove any connections referencing this thought
        const affectedConnections = connections.filter(
          (c) => c.sourceThoughtId === id || c.targetThoughtId === id
        );
        for (const c of affectedConnections) {
          await connectionRepository.delete(c.id);
        }
        setConnections((prev) => prev.filter((c) => c.sourceThoughtId !== id && c.targetThoughtId !== id));
      } catch (err) {
        console.error('Failed to delete thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to delete thought';
        setError(msg);
        throw err;
      }
    },
    [thoughtRepository, connectionRepository, connections]
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
        await collectionRepository.delete(id);
        setCollections((prev) => prev.filter((c) => c.id !== id));

        const affectedThoughts = thoughts.filter((t) => t.collectionIds?.includes(id));
        for (const t of affectedThoughts) {
          const cleaned = t.collectionIds.filter((cid) => cid !== id);
          await thoughtRepository.update(t.id, { collectionIds: cleaned });
        }

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

  const acceptConnection = useCallback(
    async (sourceId: string, targetId: string, reason: string): Promise<Connection> => {
      try {
        setError(null);
        const conn = await connectionRepository.create({
          sourceThoughtId: sourceId,
          targetThoughtId: targetId,
          status: 'accepted',
          reason,
        });
        setConnections((prev) => [conn, ...prev.filter((c) => c.id !== conn.id)]);
        return conn;
      } catch (err) {
        console.error('Failed to accept connection:', err);
        const msg = err instanceof Error ? err.message : 'Failed to accept connection';
        setError(msg);
        throw err;
      }
    },
    [connectionRepository]
  );

  const dismissConnection = useCallback(
    async (sourceId: string, targetId: string): Promise<Connection> => {
      try {
        setError(null);
        const conn = await connectionRepository.create({
          sourceThoughtId: sourceId,
          targetThoughtId: targetId,
          status: 'dismissed',
          reason: 'Dismissed by user',
        });
        setConnections((prev) => [conn, ...prev.filter((c) => c.id !== conn.id)]);
        return conn;
      } catch (err) {
        console.error('Failed to dismiss connection:', err);
        const msg = err instanceof Error ? err.message : 'Failed to dismiss connection';
        setError(msg);
        throw err;
      }
    },
    [connectionRepository]
  );

  // Rediscovery state & actions
  const [dismissedRediscoveryIds, setDismissedRediscoveryIds] = useState<Set<string>>(() => new Set());

  const rediscoveredThought = useMemo(() => {
    return pickThoughtToRevisit(thoughts, dismissedRediscoveryIds);
  }, [thoughts, dismissedRediscoveryIds]);

  const dismissRediscoveredThought = useCallback((id: string) => {
    setDismissedRediscoveryIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  // Portability actions
  const exportBackup = useCallback(() => {
    downloadBackupFile(thoughts, collections, connections);
  }, [thoughts, collections, connections]);

  const importBackup = useCallback(
    async (
      backup: GardenBackupV1,
      strategy: 'merge' | 'replace'
    ): Promise<ImportStats> => {
      try {
        setError(null);
        let thoughtsAdded = 0;
        let collectionsAdded = 0;
        let connectionsAdded = 0;

        if (strategy === 'replace') {
          await connectionRepository.clear();
          await collectionRepository.clear();
          await thoughtRepository.clear();

          for (const c of backup.garden.collections) {
            await collectionRepository.save(c);
            collectionsAdded++;
          }
          for (const t of backup.garden.thoughts) {
            await thoughtRepository.save(t);
            thoughtsAdded++;
          }
          for (const conn of backup.garden.connections) {
            await connectionRepository.save(conn);
            connectionsAdded++;
          }
        } else {
          // Merge strategy
          const existingThoughts = await thoughtRepository.getAll();
          const existingThoughtIds = new Set(existingThoughts.map((t) => t.id));

          const existingCollections = await collectionRepository.getAll();
          const existingCollectionIds = new Set(existingCollections.map((c) => c.id));

          const existingConnections = await connectionRepository.getAll();
          const hasPair = (s: string, t: string) =>
            existingConnections.some(
              (c) =>
                (c.sourceThoughtId === s && c.targetThoughtId === t) ||
                (c.sourceThoughtId === t && c.targetThoughtId === s)
            );

          for (const c of backup.garden.collections) {
            if (!existingCollectionIds.has(c.id)) {
              await collectionRepository.save(c);
              collectionsAdded++;
              existingCollectionIds.add(c.id);
            }
          }

          for (const t of backup.garden.thoughts) {
            if (!existingThoughtIds.has(t.id)) {
              await thoughtRepository.save(t);
              thoughtsAdded++;
              existingThoughtIds.add(t.id);
            }
          }

          for (const conn of backup.garden.connections) {
            if (!hasPair(conn.sourceThoughtId, conn.targetThoughtId)) {
              await connectionRepository.save(conn);
              connectionsAdded++;
            }
          }
        }

        await loadAll();
        return { thoughtsAdded, collectionsAdded, connectionsAdded };
      } catch (err) {
        console.error('Failed to import backup:', err);
        const msg = err instanceof Error ? err.message : 'Failed to import backup';
        setError(msg);
        throw err;
      }
    },
    [thoughtRepository, collectionRepository, connectionRepository, loadAll]
  );

  return (
    <StorageContext.Provider
      value={{
        thoughts,
        collections,
        connections,
        suggestedConnection,
        rediscoveredThought,
        isLoading,
        error,
        createThought,
        updateThought,
        deleteThought,
        refreshThoughts,
        toggleThoughtCollection,
        dismissRediscoveredThought,
        createCollection,
        updateCollection,
        deleteCollection,
        refreshCollections,
        acceptConnection,
        dismissConnection,
        refreshConnections,
        exportBackup,
        importBackup,
        thoughtRepository,
        collectionRepository,
        connectionRepository,
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
