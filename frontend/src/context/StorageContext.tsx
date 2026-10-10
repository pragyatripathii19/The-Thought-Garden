import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Thought } from '../types';
import { getThoughtRepository, IThoughtRepository } from '../storage';

interface StorageContextValue {
  thoughts: Thought[];
  isLoading: boolean;
  error: string | null;
  createThought: (text: string) => Promise<Thought>;
  updateThought: (id: string, updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds'>>) => Promise<Thought>;
  deleteThought: (id: string) => Promise<void>;
  refreshThoughts: () => Promise<void>;
  repository: IThoughtRepository;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export interface StorageProviderProps {
  children: React.ReactNode;
  repository?: IThoughtRepository;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({
  children,
  repository = getThoughtRepository(),
}) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshThoughts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await repository.getAll();
      setThoughts(list);
    } catch (err) {
      console.error('Failed to load thoughts:', err);
      setError(err instanceof Error ? err.message : 'Unknown storage error');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    refreshThoughts();
  }, [refreshThoughts]);

  const createThought = useCallback(
    async (text: string): Promise<Thought> => {
      try {
        setError(null);
        const newThought = await repository.create({ text });
        // Optimistically update list
        setThoughts((prev) => [newThought, ...prev]);
        return newThought;
      } catch (err) {
        console.error('Failed to create thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to save thought';
        setError(msg);
        throw err;
      }
    },
    [repository]
  );

  const updateThought = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Thought, 'text' | 'stage' | 'collectionIds'>>
    ): Promise<Thought> => {
      try {
        setError(null);
        const updated = await repository.update(id, updates);
        setThoughts((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return updated;
      } catch (err) {
        console.error('Failed to update thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to update thought';
        setError(msg);
        throw err;
      }
    },
    [repository]
  );

  const deleteThought = useCallback(
    async (id: string): Promise<void> => {
      try {
        setError(null);
        await repository.delete(id);
        setThoughts((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error('Failed to delete thought:', err);
        const msg = err instanceof Error ? err.message : 'Failed to delete thought';
        setError(msg);
        throw err;
      }
    },
    [repository]
  );

  return (
    <StorageContext.Provider
      value={{
        thoughts,
        isLoading,
        error,
        createThought,
        updateThought,
        deleteThought,
        refreshThoughts,
        repository,
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
