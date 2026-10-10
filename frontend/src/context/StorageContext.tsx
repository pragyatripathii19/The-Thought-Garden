import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Thought,
  Collection,
  Connection,
  ThoughtCategory,
  GrowthStage,
  CollectionColorVariant,
  CollectionIconType,
  PilotUserProfile,
  PilotFeedback,
  PilotFeedbackCategory,
} from '../types';
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
import { STARTER_COLLECTIONS } from '../lib/defaults';
import { syncPilotSignup, syncPilotPing, submitPilotFeedback } from '../lib/pilotApi';
import { computeTodayThoughtsCount, computeGardenStreak } from '../lib/analytics';

interface StorageContextValue {
  thoughts: Thought[];
  collections: Collection[];
  connections: Connection[];
  suggestedConnection: SuggestedConnection | null;
  rediscoveredThought: Thought | null;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
  // Pilot user profile & feedback
  userProfile: PilotUserProfile | null;
  saveUserProfile: (name: string, reasons: string[], email?: string) => Promise<void>;
  feedbacks: PilotFeedback[];
  submitFeedback: (category: PilotFeedbackCategory, rating: number, message: string, email?: string) => Promise<void>;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  // Thought actions
  createThought: (
    text: string,
    options?: { collectionIds?: string[]; category?: ThoughtCategory; stage?: GrowthStage }
  ) => Promise<Thought>;
  updateThought: (
    id: string,
    updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds' | 'isSaved' | 'category'>>
  ) => Promise<Thought>;
  deleteThought: (id: string) => Promise<void>;
  refreshThoughts: () => Promise<void>;
  toggleThoughtCollection: (thoughtId: string, collectionId: string) => Promise<Thought>;
  toggleSaveThought: (id: string) => Promise<Thought>;
  dismissRediscoveredThought: (id: string) => void;
  // Collection actions
  createCollection: (
    name: string,
    description?: string,
    options?: { colorVariant?: CollectionColorVariant; iconType?: CollectionIconType }
  ) => Promise<Collection>;
  updateCollection: (
    id: string,
    updates: { name?: string; description?: string; colorVariant?: CollectionColorVariant; iconType?: CollectionIconType }
  ) => Promise<Collection>;
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
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pilot Profile State
  const [userProfile, setUserProfile] = useState<PilotUserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('thought_garden_pilot_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('thought_garden_pilot_profile');
  });

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Feedbacks State
  const [feedbacks, setFeedbacks] = useState<PilotFeedback[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('thought_garden_pilot_feedback');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveUserProfile = useCallback(
    async (name: string, reasons: string[], email?: string) => {
      const id = userProfile?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const profile: PilotUserProfile = {
        id,
        name: name.trim() || 'Gardener',
        email: email?.trim() || undefined,
        reasons: reasons.length > 0 ? reasons : ['General Note Taking'],
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      setUserProfile(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('thought_garden_pilot_profile', JSON.stringify(profile));
      }
      setIsOnboardingOpen(false);

      // Background sync to central SQLite backend
      syncPilotSignup(profile).catch((err) => console.warn('Background signup sync deferred:', err));
    },
    [userProfile]
  );

  const submitFeedback = useCallback(
    async (category: PilotFeedbackCategory, rating: number, message: string, email?: string) => {
      const newFb: PilotFeedback = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: userProfile?.id,
        userName: userProfile?.name || 'Anonymous Gardener',
        category,
        rating,
        message,
        email: email || userProfile?.email,
        createdAt: new Date().toISOString(),
      };

      const updated = [newFb, ...feedbacks];
      setFeedbacks(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('thought_garden_pilot_feedback', JSON.stringify(updated));
      }

      // Background sync to central SQLite backend
      submitPilotFeedback(newFb).catch((err) => console.warn('Background feedback sync deferred:', err));
    },
    [userProfile, feedbacks]
  );

  // Background activity ping to central backend (debounced)
  const lastPingRef = useRef<string>('');
  useEffect(() => {
    if (!userProfile) return;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = computeTodayThoughtsCount(thoughts);
    const streak = computeGardenStreak(thoughts);
    const pingKey = `${today}_${todayCount}_${thoughts.length}`;

    if (lastPingRef.current !== pingKey) {
      lastPingRef.current = pingKey;
      syncPilotPing({
        userId: userProfile.id,
        date: today,
        thoughtsCount: todayCount,
        totalThoughts: thoughts.length,
        streak,
      }).catch((err) => console.warn('Background activity ping deferred:', err));
    }
  }, [thoughts, userProfile]);

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

      // Idempotent starter seeding: seed the 4 starter collections (with 0 thoughts) if collection store is empty
      const hasSeeded = typeof window !== 'undefined' ? localStorage.getItem('thought_garden_starter_seeded') : null;
      if (!hasSeeded) {
        const colCount = await collectionRepository.count();
        if (colCount === 0) {
          for (const col of STARTER_COLLECTIONS) {
            await collectionRepository.save(col);
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('thought_garden_starter_seeded', 'true');
        }
      }

      await Promise.all([refreshThoughts(), refreshCollections(), refreshConnections()]);
    } finally {
      setIsLoading(false);
    }
  }, [thoughtRepository, collectionRepository, connectionRepository, refreshThoughts, refreshCollections, refreshConnections]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Compute live suggested connection candidate
  const suggestedConnection = useMemo(() => {
    return findTopSuggestedConnection(thoughts, connections);
  }, [thoughts, connections]);

  const createThought = useCallback(
    async (
      text: string,
      options?: { collectionIds?: string[]; category?: ThoughtCategory; stage?: GrowthStage }
    ): Promise<Thought> => {
      try {
        setError(null);
        const newThought = await thoughtRepository.create({
          text,
          collectionIds: options?.collectionIds,
          category: options?.category,
          stage: options?.stage,
        });
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
      updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds' | 'isSaved' | 'category'>>
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

  const toggleSaveThought = useCallback(
    async (id: string): Promise<Thought> => {
      const thought = thoughts.find((t) => t.id === id);
      if (!thought) {
        throw new Error('Thought not found');
      }
      return await updateThought(id, { isSaved: !thought.isSaved });
    },
    [thoughts, updateThought]
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
    async (
      name: string,
      description?: string,
      options?: { colorVariant?: CollectionColorVariant; iconType?: CollectionIconType }
    ): Promise<Collection> => {
      try {
        setError(null);
        const newCollection = await collectionRepository.create({
          name,
          description,
          colorVariant: options?.colorVariant,
          iconType: options?.iconType,
        });
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
    async (
      id: string,
      updates: { name?: string; description?: string; colorVariant?: CollectionColorVariant; iconType?: CollectionIconType }
    ): Promise<Collection> => {
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
        activeCollectionId,
        setActiveCollectionId,
        isLoading,
        error,
        userProfile,
        saveUserProfile,
        feedbacks,
        submitFeedback,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        createThought,
        updateThought,
        deleteThought,
        refreshThoughts,
        toggleThoughtCollection,
        toggleSaveThought,
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
