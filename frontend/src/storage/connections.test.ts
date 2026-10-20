import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConnectionRepository } from './memory/InMemoryConnectionRepository';
import { InMemoryThoughtRepository } from './memory/InMemoryThoughtRepository';
import { extractMeaningfulTokens, formatConnectionReason, sharedWords, stemWord } from '../lib/connections';

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

  it('matches word forms by stem, so "vote" meets "voting"', () => {
    expect(stemWord('voting')).toBe(stemWord('vote'));
    expect(stemWord('voters')).toBe(stemWord('vote'));
    expect(stemWord('running')).toBe(stemWord('run'));
    expect(stemWord('classes')).toBe(stemWord('class'));
    expect(stemWord('stories')).toBe('story');
    expect(sharedWords('Voting in the local elections', 'Who should I vote for in this election?')).toEqual(['voting', 'elections']);
  });

  it('ignores filler words when comparing', () => {
    expect(sharedWords('I really think about the garden', 'Maybe think about the weather')).toEqual([]);
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

  it('keeps the kind and subject of a suggestion when it is accepted', async () => {
    await connRepo.create({
      sourceThoughtId: 't1',
      targetThoughtId: 't2',
      status: 'suggested',
      reason: 'Both are about voting.',
      kind: 'shared-theme',
      subject: 'elections and voting',
      score: 0.29,
    });
    const accepted = await connRepo.create({ sourceThoughtId: 't2', targetThoughtId: 't1', status: 'accepted', reason: 'Both are about voting.' });
    expect(accepted.status).toBe('accepted');
    expect(accepted.kind).toBe('shared-theme');
    expect(accepted.subject).toBe('elections and voting');
    expect(accepted.score).toBe(0.29);
    expect(await connRepo.count()).toBe(1);
  });
});
