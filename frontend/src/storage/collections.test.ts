import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCollectionRepository } from './memory/InMemoryCollectionRepository';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { normalizeText, searchGarden } from '../lib/search';

describe('Collection Repository & Safe Grouping Tests', () => {
  let colRepo: InMemoryCollectionRepository;
  let thoughtRepo: InMemoryThoughtRepository;

  beforeEach(() => {
    colRepo = new InMemoryCollectionRepository();
    thoughtRepo = new InMemoryThoughtRepository();
  });

  it('should create a collection with name and optional description', async () => {
    const col = await colRepo.create({
      name: 'Creative Writing',
      description: 'Stories, prompts, and poetic fragments',
    });

    expect(col.id).toBeDefined();
    expect(col.name).toBe('Creative Writing');
    expect(col.description).toBe('Stories, prompts, and poetic fragments');
    expect(col.createdAt).toBeDefined();
    expect(col.updatedAt).toBeDefined();
  });

  it('should reject empty or whitespace-only collection names', async () => {
    await expect(colRepo.create({ name: '' })).rejects.toThrow('Collection name cannot be empty');
    await expect(colRepo.create({ name: '   ' })).rejects.toThrow('Collection name cannot be empty');
  });

  it('should update collection name and description', async () => {
    const created = await colRepo.create({ name: 'Old Title' });
    const updated = await colRepo.update(created.id, {
      name: 'New Title',
      description: 'Updated description',
    });

    expect(updated.name).toBe('New Title');
    expect(updated.description).toBe('Updated description');

    const fetched = await colRepo.getById(created.id);
    expect(fetched?.name).toBe('New Title');
  });

  it('should delete a collection without affecting thought data', async () => {
    const col = await colRepo.create({ name: 'Sprint Notes' });
    const thought = await thoughtRepo.create({
      text: 'Crucial observation that must never be deleted',
      collectionIds: [col.id],
    });

    expect(await colRepo.count()).toBe(1);
    expect(thought.collectionIds).toContain(col.id);

    // Delete collection
    await colRepo.delete(col.id);
    expect(await colRepo.count()).toBe(0);

    // Thought must still exist in thought repo!
    const persistedThought = await thoughtRepo.getById(thought.id);
    expect(persistedThought).not.toBeNull();
    expect(persistedThought?.text).toBe('Crucial observation that must never be deleted');
  });

  it('should list collections in reverse chronological order', async () => {
    const c1 = await colRepo.create({ name: 'First Collection' });
    const c2 = await colRepo.create({ name: 'Second Collection' });

    const all = await colRepo.getAll();
    expect(all.length).toBe(2);
    expect(all[0].id).toBe(c2.id);
    expect(all[1].id).toBe(c1.id);
  });
});

describe('Search Engine Normalization & Garden Matching Tests', () => {
  it('should normalize text by stripping punctuation, accents, and casing', () => {
    expect(normalizeText('Café & Résumé!')).toBe('cafe resume');
    expect(normalizeText('  Hello,   World...  ')).toBe('hello world');
  });

  it('should find thoughts matching multi-word queries regardless of case or punctuation', async () => {
    const thoughts = [
      {
        id: '1',
        text: 'The architecture of natural systems is regenerative.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collectionIds: [],
      },
      {
        id: '2',
        text: 'Learning how plants communicate through fungal networks.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collectionIds: [],
      },
    ];

    const collections = [
      {
        id: 'c1',
        name: 'Botany & Ecology',
        description: 'Nature studies',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Search query with mixed casing and punctuation
    const res = searchGarden('natural, ARCHITECTURE', thoughts, collections);
    expect(res.matchingThoughts.length).toBe(1);
    expect(res.matchingThoughts[0].id).toBe('1');
    expect(res.matchingCollections.length).toBe(0);

    // Search across collections
    const colRes = searchGarden('botany', thoughts, collections);
    expect(colRes.matchingCollections.length).toBe(1);
    expect(colRes.matchingCollections[0].id).toBe('c1');

    // Empty query returns nothing
    const emptyRes = searchGarden('   ', thoughts, collections);
    expect(emptyRes.matchingThoughts.length).toBe(0);
    expect(emptyRes.matchingCollections.length).toBe(0);
  });
});
