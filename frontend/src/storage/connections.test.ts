import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConnectionRepository } from './memory/InMemoryConnectionRepository';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import {
  extractMeaningfulTokens,
  findTopSuggestedConnection,
  formatConnectionReason,
} from '../lib/connections';
import { Thought } from '../types';

describe('Local Connection Discovery Algorithm Tests', () => {
  it('should filter common stop-words and short tokens', () => {
    const text = 'This is a note about the regenerative architecture of urban gardens';
    const tokens = extractMeaningfulTokens(text);

    // Stop words like 'this', 'is', 'a', 'about', 'the', 'of' must not be in tokens
    expect(tokens).not.toContain('this');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('about');
    expect(tokens).toContain('regenerative');
    expect(tokens).toContain('architecture');
    expect(tokens).toContain('urban');
    expect(tokens).toContain('gardens');
  });

  it('should format a transparent, grounded reason for shared words', () => {
    const reason2 = formatConnectionReason(['soil', 'compost']);
    expect(reason2).toBe('Both thoughts mention "soil" and "compost".');

    const reason3 = formatConnectionReason(['trees', 'forest', 'roots']);
    expect(reason3).toBe('Both thoughts mention "trees", "forest", and "roots".');
  });

  it('should discover connection when 2 or more meaningful tokens match', () => {
    const t1: Thought = {
      id: 't1',
      text: 'Permaculture design principles for urban forest gardens.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionIds: [],
    };

    const t2: Thought = {
      id: 't2',
      text: 'We planted an urban forest with indigenous species today.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionIds: [],
    };

    const suggestion = findTopSuggestedConnection([t1, t2], []);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.sharedTokens).toContain('urban');
    expect(suggestion?.sharedTokens).toContain('forest');
    expect(suggestion?.reason).toContain('urban');
    expect(suggestion?.reason).toContain('forest');
  });

  it('should show NO suggestion if fewer than 2 meaningful terms match (conservative threshold)', () => {
    const t1: Thought = {
      id: 't1',
      text: 'Reading a book on typography.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionIds: [],
    };

    const t2: Thought = {
      id: 't2',
      text: 'Looking at another book tomorrow.', // Only shares 'book'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionIds: [],
    };

    const suggestion = findTopSuggestedConnection([t1, t2], []);
    expect(suggestion).toBeNull();
  });

  it('should never suggest a pair that was already accepted or dismissed', () => {
    const t1: Thought = {
      id: 't1',
      text: 'Urban forest gardening is rewarding.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionIds: [],
    };

    const t2: Thought = {
      id: 't2',
      text: 'Studying urban forest ecosystems.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collectionIds: [],
    };

    const dismissedConnection = {
      id: 'c1',
      sourceThoughtId: 't1',
      targetThoughtId: 't2',
      status: 'dismissed' as const,
      reason: 'Dismissed by user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // When dismissed, suggestion should be suppressed
    const suggestion = findTopSuggestedConnection([t1, t2], [dismissedConnection]);
    expect(suggestion).toBeNull();
  });
});

describe('Connection Repository Contract Tests', () => {
  let connRepo: InMemoryConnectionRepository;
  let thoughtRepo: InMemoryThoughtRepository;

  beforeEach(() => {
    connRepo = new InMemoryConnectionRepository();
    thoughtRepo = new InMemoryThoughtRepository();
  });

  it('should reject self-connecting a thought', async () => {
    await expect(
      connRepo.create({
        sourceThoughtId: 'same-id',
        targetThoughtId: 'same-id',
        status: 'suggested',
        reason: 'Self test',
      })
    ).rejects.toThrow('Cannot connect a thought to itself');
  });

  it('should create and retrieve a connection pair symmetrically', async () => {
    const t1 = await thoughtRepo.create({ text: 'Thought Alpha' });
    const t2 = await thoughtRepo.create({ text: 'Thought Beta' });

    const conn = await connRepo.create({
      sourceThoughtId: t1.id,
      targetThoughtId: t2.id,
      status: 'accepted',
      reason: 'Related topics',
    });

    expect(conn.id).toBeDefined();
    expect(conn.status).toBe('accepted');

    // Symmetrical pair lookup: both forward and reverse find the same record
    const foundForward = await connRepo.findPair(t1.id, t2.id);
    const foundReverse = await connRepo.findPair(t2.id, t1.id);

    expect(foundForward?.id).toBe(conn.id);
    expect(foundReverse?.id).toBe(conn.id);
  });

  it('should filter connections by status', async () => {
    await connRepo.create({
      sourceThoughtId: 't1',
      targetThoughtId: 't2',
      status: 'accepted',
      reason: 'Accepted link',
    });

    await connRepo.create({
      sourceThoughtId: 't3',
      targetThoughtId: 't4',
      status: 'dismissed',
      reason: 'Dismissed link',
    });

    const accepted = await connRepo.getByStatus('accepted');
    const dismissed = await connRepo.getByStatus('dismissed');

    expect(accepted.length).toBe(1);
    expect(dismissed.length).toBe(1);
    expect(accepted[0].reason).toBe('Accepted link');
  });
});
