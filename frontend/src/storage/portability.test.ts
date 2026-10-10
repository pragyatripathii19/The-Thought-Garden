import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeGardenBackup,
  validateGardenBackup,
  GardenBackupV1,
} from '../lib/portability';
import { pickThoughtToRevisit } from '../lib/rediscovery';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { InMemoryCollectionRepository } from './memory/InMemoryCollectionRepository';
import { InMemoryConnectionRepository } from './memory/InMemoryConnectionRepository';
import { Thought, Collection, Connection } from '../types';

describe('Piece 6: Data Portability & Rediscovery', () => {
  let thoughtRepo: InMemoryThoughtRepository;
  let collectionRepo: InMemoryCollectionRepository;
  let connectionRepo: InMemoryConnectionRepository;

  beforeEach(() => {
    thoughtRepo = new InMemoryThoughtRepository();
    collectionRepo = new InMemoryCollectionRepository();
    connectionRepo = new InMemoryConnectionRepository();
  });

  describe('serializeGardenBackup', () => {
    it('creates a valid GardenBackupV1 JSON string', () => {
      const mockThoughts: Thought[] = [
        {
          id: 't-1',
          text: 'First reflection on soil biology',
          createdAt: '2026-10-01T10:00:00Z',
          updatedAt: '2026-10-01T10:00:00Z',
          stage: 'seed',
          collectionIds: ['c-1'],
        },
      ];
      const mockCollections: Collection[] = [
        {
          id: 'c-1',
          name: 'Biology',
          description: 'Living systems',
          createdAt: '2026-10-01T09:00:00Z',
          updatedAt: '2026-10-01T09:00:00Z',
        },
      ];
      const mockConnections: Connection[] = [
        {
          id: 'conn-1',
          sourceThoughtId: 't-1',
          targetThoughtId: 't-2',
          status: 'accepted',
          reason: 'Both mention soil',
          createdAt: '2026-10-01T11:00:00Z',
          updatedAt: '2026-10-01T11:00:00Z',
        },
      ];

      const jsonStr = serializeGardenBackup(mockThoughts, mockCollections, mockConnections);
      const parsed = JSON.parse(jsonStr) as GardenBackupV1;

      expect(parsed.version).toBe(1);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.garden.thoughts).toHaveLength(1);
      expect(parsed.garden.thoughts[0].text).toBe('First reflection on soil biology');
      expect(parsed.garden.collections).toHaveLength(1);
      expect(parsed.garden.collections[0].name).toBe('Biology');
      expect(parsed.garden.connections).toHaveLength(1);
    });
  });

  describe('validateGardenBackup', () => {
    it('approves a valid GardenBackupV1 payload', () => {
      const validPayload: GardenBackupV1 = {
        version: 1,
        exportedAt: '2026-10-10T00:00:00Z',
        garden: {
          thoughts: [
            {
              id: 't-100',
              text: 'Valid thought content',
              createdAt: '2026-10-01T10:00:00Z',
              updatedAt: '2026-10-01T10:00:00Z',
              stage: 'seed',
              collectionIds: [],
            },
          ],
          collections: [],
          connections: [],
        },
      };

      const result = validateGardenBackup(JSON.stringify(validPayload));
      expect(result.valid).toBe(true);
      expect(result.backup?.garden.thoughts[0].id).toBe('t-100');
      expect(result.error).toBeUndefined();
    });

    it('rejects empty or whitespace-only input', () => {
      const result = validateGardenBackup('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('rejects malformed non-JSON text', () => {
      const result = validateGardenBackup('{ not json at all');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON format');
    });

    it('rejects unsupported backup versions', () => {
      const payload = {
        version: 2,
        exportedAt: '2026-10-10T00:00:00Z',
        garden: { thoughts: [], collections: [], connections: [] },
      };
      const result = validateGardenBackup(JSON.stringify(payload));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported backup version');
    });

    it('rejects thoughts missing essential fields or containing empty text', () => {
      const invalidThoughts = {
        version: 1,
        exportedAt: '2026-10-10T00:00:00Z',
        garden: {
          thoughts: [
            {
              id: 't-bad',
              text: '   ',
              createdAt: '2026-10-01T10:00:00Z',
            },
          ],
          collections: [],
          connections: [],
        },
      };

      const result = validateGardenBackup(JSON.stringify(invalidThoughts));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('contains empty text');
    });
  });

  describe('Storage Import Fidelity (Merge & Replace)', () => {
    it('correctly replaces existing storage when strategy is replace', async () => {
      // Seed initial data
      await thoughtRepo.create({ text: 'Existing thought to be wiped' });
      await collectionRepo.create({ name: 'Old Collection' });

      expect(await thoughtRepo.count()).toBe(1);
      expect(await collectionRepo.count()).toBe(1);

      // Backup to restore
      const backup: GardenBackupV1 = {
        version: 1,
        exportedAt: new Date().toISOString(),
        garden: {
          thoughts: [
            {
              id: 't-new-1',
              text: 'Restored thought A',
              createdAt: '2026-10-05T10:00:00Z',
              updatedAt: '2026-10-05T10:00:00Z',
              stage: 'sprout',
              collectionIds: ['col-new-1'],
            },
            {
              id: 't-new-2',
              text: 'Restored thought B',
              createdAt: '2026-10-06T10:00:00Z',
              updatedAt: '2026-10-06T10:00:00Z',
              stage: 'seed',
              collectionIds: [],
            },
          ],
          collections: [
            {
              id: 'col-new-1',
              name: 'Restored Collection',
              createdAt: '2026-10-05T09:00:00Z',
              updatedAt: '2026-10-05T09:00:00Z',
            },
          ],
          connections: [],
        },
      };

      // Perform replace
      await thoughtRepo.clear();
      await collectionRepo.clear();
      await connectionRepo.clear();

      for (const c of backup.garden.collections) {
        await collectionRepo.save(c);
      }
      for (const t of backup.garden.thoughts) {
        await thoughtRepo.save(t);
      }

      const thoughts = await thoughtRepo.getAll();
      const collections = await collectionRepo.getAll();

      expect(thoughts).toHaveLength(2);
      expect(thoughts[0].text).toBe('Restored thought B');
      expect(collections).toHaveLength(1);
      expect(collections[0].name).toBe('Restored Collection');
    });

    it('merges new items without duplicating existing IDs', async () => {
      // Existing data
      const existing = await thoughtRepo.create({ text: 'Initial Thought 1' });

      // Incoming backup has same ID for thought 1, plus a new thought 2
      const backup: GardenBackupV1 = {
        version: 1,
        exportedAt: new Date().toISOString(),
        garden: {
          thoughts: [
            {
              id: existing.id,
              text: 'Duplicate should not overwrite',
              createdAt: existing.createdAt,
              updatedAt: existing.updatedAt,
              stage: 'seed',
              collectionIds: [],
            },
            {
              id: 't-unique-2',
              text: 'Brand new imported thought',
              createdAt: '2026-10-07T12:00:00Z',
              updatedAt: '2026-10-07T12:00:00Z',
              stage: 'seed',
              collectionIds: [],
            },
          ],
          collections: [],
          connections: [],
        },
      };

      // Merge logic
      const currentThoughts = await thoughtRepo.getAll();
      const currentIds = new Set(currentThoughts.map((t) => t.id));

      for (const t of backup.garden.thoughts) {
        if (!currentIds.has(t.id)) {
          await thoughtRepo.save(t);
          currentIds.add(t.id);
        }
      }

      const all = await thoughtRepo.getAll();
      expect(all).toHaveLength(2);
      // Original thought preserved verbatim
      const foundOriginal = all.find((t) => t.id === existing.id);
      expect(foundOriginal?.text).toBe('Initial Thought 1');
      // New thought added
      const foundNew = all.find((t) => t.id === 't-unique-2');
      expect(foundNew?.text).toBe('Brand new imported thought');
    });
  });

  describe('pickThoughtToRevisit (Gentle Rediscovery)', () => {
    it('returns null if there are fewer than 3 thoughts', () => {
      const thoughts: Thought[] = [
        {
          id: '1',
          text: 'One',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
        {
          id: '2',
          text: 'Two',
          createdAt: '2026-10-02T00:00:00Z',
          updatedAt: '2026-10-02T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
      ];

      expect(pickThoughtToRevisit(thoughts)).toBeNull();
    });

    it('samples from older thoughts and excludes the 2 most recent thoughts', () => {
      const thoughts: Thought[] = [
        {
          id: 't-oldest',
          text: 'Oldest insight',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
        {
          id: 't-recent-1',
          text: 'Recent insight 1',
          createdAt: '2026-10-08T00:00:00Z',
          updatedAt: '2026-10-08T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
        {
          id: 't-recent-2',
          text: 'Recent insight 2',
          createdAt: '2026-10-09T00:00:00Z',
          updatedAt: '2026-10-09T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
      ];

      const selected = pickThoughtToRevisit(thoughts);
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('t-oldest');
    });

    it('respects dismissedIds and skips dismissed thoughts', () => {
      const thoughts: Thought[] = [
        {
          id: 't-old-1',
          text: 'Old 1',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
        {
          id: 't-old-2',
          text: 'Old 2',
          createdAt: '2026-09-05T00:00:00Z',
          updatedAt: '2026-09-05T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
        {
          id: 't-recent-1',
          text: 'Recent 1',
          createdAt: '2026-10-08T00:00:00Z',
          updatedAt: '2026-10-08T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
        {
          id: 't-recent-2',
          text: 'Recent 2',
          createdAt: '2026-10-09T00:00:00Z',
          updatedAt: '2026-10-09T00:00:00Z',
          stage: 'seed',
          collectionIds: [],
        },
      ];

      const dismissed = new Set(['t-old-1']);
      const selected = pickThoughtToRevisit(thoughts, dismissed);
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('t-old-2');

      dismissed.add('t-old-2');
      const noneLeft = pickThoughtToRevisit(thoughts, dismissed);
      expect(noneLeft).toBeNull();
    });
  });
});
