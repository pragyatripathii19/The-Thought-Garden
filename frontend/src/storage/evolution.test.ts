import { describe, it, expect, beforeEach } from 'vitest';
import { STARTER_COLLECTIONS, getStarterThoughts, getStarterConnections } from '../lib/defaults';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { InMemoryCollectionRepository } from './memory/InMemoryCollectionRepository';
import { InMemoryConnectionRepository } from './memory/InMemoryConnectionRepository';

describe('UI/UX Evolution & Starter Integrity', () => {
  let thoughtRepo: InMemoryThoughtRepository;
  let collectionRepo: InMemoryCollectionRepository;
  let connectionRepo: InMemoryConnectionRepository;

  beforeEach(() => {
    thoughtRepo = new InMemoryThoughtRepository();
    collectionRepo = new InMemoryCollectionRepository();
    connectionRepo = new InMemoryConnectionRepository();
  });

  it('contains the 4 starter collections matching the visual reference', () => {
    expect(STARTER_COLLECTIONS).toHaveLength(4);
    const names = STARTER_COLLECTIONS.map((c) => c.name);
    expect(names).toContain('Startup Ideas');
    expect(names).toContain('Writing');
    expect(names).toContain('Things to Research');
    expect(names).toContain('Tasks to Revisit');
  });

  it('seeds 8 starter thoughts with correct categories', () => {
    const starterThoughts = getStarterThoughts();
    expect(starterThoughts).toHaveLength(8);
    const categories = starterThoughts.map((t) => t.category);
    expect(categories).toContain('connection');
    expect(categories).toContain('research');
    expect(categories).toContain('writing');
    expect(categories).toContain('task');
    expect(categories).toContain('idea');
  });

  it('correctly persists and toggles isSaved bookmark state', async () => {
    const created = await thoughtRepo.create({
      text: 'Insight worth pinning',
      isSaved: false,
    });
    expect(created.isSaved).toBe(false);

    const updated = await thoughtRepo.update(created.id, { isSaved: true });
    expect(updated.isSaved).toBe(true);

    const retrieved = await thoughtRepo.getById(created.id);
    expect(retrieved?.isSaved).toBe(true);
  });

  it('idempotently saves starter data into empty repositories', async () => {
    expect(await collectionRepo.count()).toBe(0);
    expect(await thoughtRepo.count()).toBe(0);

    for (const c of STARTER_COLLECTIONS) {
      await collectionRepo.save(c);
    }
    for (const t of getStarterThoughts()) {
      await thoughtRepo.save(t);
    }
    for (const conn of getStarterConnections()) {
      await connectionRepo.save(conn);
    }

    expect(await collectionRepo.count()).toBe(4);
    expect(await thoughtRepo.count()).toBe(8);
    expect(await connectionRepo.count()).toBe(3);

    // Verify Startup Ideas member count
    const allThoughts = await thoughtRepo.getAll();
    const startupThoughts = allThoughts.filter((t) => t.collectionIds.includes('col-startup-ideas'));
    expect(startupThoughts.length).toBeGreaterThanOrEqual(4);
  });
});
