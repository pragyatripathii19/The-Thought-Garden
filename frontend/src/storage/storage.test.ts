import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { IThoughtRepository } from './types';

describe('Storage Abstraction & Repository Contract Tests', () => {
  let repo: InMemoryThoughtRepository;

  beforeEach(() => {
    repo = new InMemoryThoughtRepository();
  });

  it('should create a thought without requiring any metadata', async () => {
    const thought = await repo.create({ text: 'A fleeting idea about regenerative gardening' });

    expect(thought.id).toBeDefined();
    expect(thought.text).toBe('A fleeting idea about regenerative gardening');
    expect(thought.createdAt).toBeDefined();
    expect(thought.updatedAt).toBeDefined();
    expect(thought.collectionIds).toEqual([]);
    expect(thought.stage).toBe('seed');
  });

  it('should reject empty or whitespace-only thoughts', async () => {
    await expect(repo.create({ text: '' })).rejects.toThrow('Thought text cannot be empty');
    await expect(repo.create({ text: '   ' })).rejects.toThrow('Thought text cannot be empty');
  });

  it('should return thoughts in reverse chronological order (newest first)', async () => {
    const t1 = await repo.create({ text: 'First thought' });
    // Artificially space out slightly if needed
    const t2 = await repo.create({ text: 'Second thought' });
    const t3 = await repo.create({ text: 'Third thought' });

    const all = await repo.getAll();
    expect(all.length).toBe(3);
    expect(all[0].id).toBe(t3.id);
    expect(all[1].id).toBe(t2.id);
    expect(all[2].id).toBe(t1.id);
  });

  it('should retrieve a thought by id', async () => {
    const created = await repo.create({ text: 'Specific searchable fragment' });
    const retrieved = await repo.getById(created.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.text).toBe('Specific searchable fragment');
  });

  it('should return null for non-existent id', async () => {
    const retrieved = await repo.getById('non-existent-id');
    expect(retrieved).toBeNull();
  });

  it('should update thought text and refresh updatedAt', async () => {
    const created = await repo.create({ text: 'Draft phrasing' });
    
    // Small timeout to guarantee timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updated = await repo.update(created.id, { text: 'Refined thought wording' });
    expect(updated.text).toBe('Refined thought wording');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.createdAt).getTime());

    const fetched = await repo.getById(created.id);
    expect(fetched?.text).toBe('Refined thought wording');
  });

  it('should delete a thought', async () => {
    const t = await repo.create({ text: 'Thought to be deleted' });
    expect(await repo.count()).toBe(1);

    await repo.delete(t.id);
    expect(await repo.count()).toBe(0);
    expect(await repo.getById(t.id)).toBeNull();
  });

  it('should update thought growth stage', async () => {
    const created = await repo.create({ text: 'Observation about morning light' });
    expect(created.stage).toBe('seed');

    const sprouted = await repo.update(created.id, { stage: 'sprout' });
    expect(sprouted.stage).toBe('sprout');

    const bloomed = await repo.update(created.id, { stage: 'bloom' });
    expect(bloomed.stage).toBe('bloom');

    const mature = await repo.update(created.id, { stage: 'mature' });
    expect(mature.stage).toBe('mature');

    const fetched = await repo.getById(created.id);
    expect(fetched?.stage).toBe('mature');
  });

  it('should preserve createdAt timestamp when updating text or stage', async () => {
    const created = await repo.create({ text: 'Original inspiration' });
    const originalCreatedAt = created.createdAt;

    await new Promise((resolve) => setTimeout(resolve, 15));

    const updated = await repo.update(created.id, {
      text: 'Original inspiration refined',
      stage: 'sprout',
    });

    expect(updated.createdAt).toBe(originalCreatedAt);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(originalCreatedAt).getTime());
  });

  it('should reject updating thought to empty string', async () => {
    const created = await repo.create({ text: 'Valid thought' });
    await expect(repo.update(created.id, { text: '' })).rejects.toThrow('Thought text cannot be empty');
    await expect(repo.update(created.id, { text: '   ' })).rejects.toThrow('Thought text cannot be empty');
  });

  it('should conform to the IThoughtRepository interface contract', () => {
    const repoInterfaceCheck: IThoughtRepository = repo;
    expect(typeof repoInterfaceCheck.create).toBe('function');
    expect(typeof repoInterfaceCheck.getAll).toBe('function');
    expect(typeof repoInterfaceCheck.getById).toBe('function');
    expect(typeof repoInterfaceCheck.update).toBe('function');
    expect(typeof repoInterfaceCheck.delete).toBe('function');
    expect(typeof repoInterfaceCheck.count).toBe('function');
  });
});
