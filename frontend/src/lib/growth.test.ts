import { describe, it, expect } from 'vitest';
import { Connection, Thought } from '../types';
import { applyThoughtUpdate } from '../storage/types';
import { describeGrowth, earnedStage, evolvedStage, growthSignals } from './growth';

const now = new Date().toISOString();
const thought = (extra: Partial<Thought> = {}): Thought => ({
  id: 't',
  text: 'A small idea',
  createdAt: now,
  updatedAt: now,
  collectionIds: [],
  stage: 'seed',
  ...extra,
});
const link = (a: string, b: string, status: Connection['status'] = 'accepted'): Connection => ({
  id: `${a}-${b}`,
  sourceThoughtId: a,
  targetThoughtId: b,
  status,
  reason: '',
  createdAt: now,
  updatedAt: now,
});

describe('growth stages', () => {
  it('a new, untouched thought stays a seed', () => {
    expect(evolvedStage(thought(), [])).toBeNull();
  });

  it.each([
    ['edited', { editCount: 1 }],
    ['saved', { isSaved: true }],
    ['in a collection', { collectionIds: ['col-writing'] }],
  ])('sprouts once %s', (_label, extra) => {
    expect(evolvedStage(thought(extra), [])).toBe('sprout');
  });

  it('sprouts once connected, but a suggestion or dismissal does not count', () => {
    expect(evolvedStage(thought(), [link('t', 'x')])).toBe('sprout');
    expect(evolvedStage(thought(), [link('t', 'x', 'dismissed')])).toBeNull();
    expect(evolvedStage(thought(), [link('t', 'x', 'suggested')])).toBeNull();
  });

  it('blooms only when connected AND grown', () => {
    const connected = [link('x', 't')];
    expect(evolvedStage(thought({ editCount: 1 }), connected)).toBe('sprout');
    expect(evolvedStage(thought({ editCount: 2 }), connected)).toBe('bloom');
    expect(evolvedStage(thought({ text: 'x'.repeat(300) }), connected)).toBe('bloom');
    expect(evolvedStage(thought({ collectionIds: ['a', 'b'] }), connected)).toBe('bloom');
    // Grown but not connected: still only a sprout.
    expect(evolvedStage(thought({ editCount: 5, text: 'x'.repeat(400) }), [])).toBe('sprout');
  });

  it('never reaches Mature on its own', () => {
    const everything = thought({ editCount: 9, isSaved: true, collectionIds: ['a', 'b', 'c'], text: 'x'.repeat(900) });
    expect(earnedStage(growthSignals(everything, [link('t', 'x'), link('t', 'y')]))).toBe('bloom');
  });

  it('never moves a thought backwards', () => {
    expect(evolvedStage(thought({ stage: 'bloom' }), [])).toBeNull();
    expect(evolvedStage(thought({ stage: 'mature' }), [link('t', 'x')])).toBeNull();
  });

  it('leaves hand-picked stages alone', () => {
    expect(evolvedStage(thought({ stageManual: true, editCount: 3 }), [link('t', 'x')])).toBeNull();
  });
});

describe('growth bookkeeping in thought updates', () => {
  it('counts text edits only when the text actually changes', () => {
    const t = thought();
    expect(applyThoughtUpdate(t, { text: 'A small idea' }).editCount).toBeUndefined();
    const once = applyThoughtUpdate(t, { text: 'A bigger idea' });
    expect(once.editCount).toBe(1);
    expect(applyThoughtUpdate(once, { text: 'A much bigger idea' }).editCount).toBe(2);
    expect(applyThoughtUpdate(t, { isSaved: true }).editCount).toBeUndefined();
  });

  it('treats a directly set stage as the user’s choice', () => {
    const picked = applyThoughtUpdate(thought(), { stage: 'mature' });
    expect(picked).toMatchObject({ stage: 'mature', stageManual: true });
    expect(applyThoughtUpdate(picked, { stageManual: false }).stageManual).toBe(false);
  });

  it('applies an automatic stage without marking it manual or counting as tending', () => {
    const t = thought({ updatedAt: '2026-01-01T00:00:00.000Z' });
    const grown = applyThoughtUpdate(t, { evolvedStage: 'sprout' });
    expect(grown.stage).toBe('sprout');
    expect(grown.stageManual).toBeUndefined();
    expect(grown.updatedAt).toBe(t.updatedAt);
  });
});

describe('growth explanations', () => {
  it('explains each stage and what comes next', () => {
    expect(describeGrowth(thought(), [])).toMatchObject({ why: 'Just planted.' });
    const sprout = describeGrowth(thought({ stage: 'sprout', collectionIds: ['c1'] }), [], [
      { id: 'c1', name: 'Writing', createdAt: now, updatedAt: now },
    ]);
    expect(sprout.why).toContain('Writing');
    expect(sprout.next).toContain('connect it');
    expect(describeGrowth(thought({ stage: 'bloom' }), []).next).toContain('Mature');
    expect(describeGrowth(thought({ stage: 'mature' }), []).next).toBeNull();
    expect(describeGrowth(thought({ stage: 'sprout', stageManual: true }), []).why).toContain('You chose');
  });
});
