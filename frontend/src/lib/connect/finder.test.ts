import { describe, it, expect } from 'vitest';
import { Connection, Thought } from '../../types';
import { hashText } from '../organize/embedder';
import {
  checkMarker,
  findCandidates,
  linksFromAi,
  localLinks,
  needsCheck,
  nextToCheck,
  pairKey,
  rankSuggestions,
  recordedPairs,
  staleSuggestions,
  wordLinks,
} from './finder';
import { describeConnection } from './labels';

const thought = (id: string, text: string, extra: Partial<Thought> = {}): Thought => ({
  id,
  text,
  createdAt: `2026-10-${String(10 + Number(id.replace(/\D/g, '') || 0)).padStart(2, '0')}T10:00:00.000Z`,
  updatedAt: '2026-10-19T10:00:00.000Z',
  collectionIds: [],
  ...extra,
});

const connection = (id: string, a: string, b: string, extra: Partial<Connection> = {}): Connection => ({
  id,
  sourceThoughtId: a,
  targetThoughtId: b,
  status: 'suggested',
  reason: 'Because.',
  createdAt: '2026-10-19T10:00:00.000Z',
  updatedAt: '2026-10-19T10:00:00.000Z',
  ...extra,
});

/** Unit vectors at a chosen similarity to [1, 0]. */
const at = (similarity: number) => [similarity, Math.sqrt(1 - similarity * similarity)];

describe('which thoughts are checked for connections', () => {
  const t = thought('t1', 'Thinking about the elections');

  it('checks a thought that was never checked, or was edited since', () => {
    expect(needsCheck(t, true)).toBe(true);
    expect(needsCheck({ ...t, connectChecked: 'old-hash' }, false)).toBe(true);
  });

  it('skips a thought already checked with the AI', () => {
    expect(needsCheck({ ...t, connectChecked: checkMarker(t, true) }, true)).toBe(false);
    expect(checkMarker(t, true)).toBe(hashText(t.text));
  });

  it('checks again with the AI what was only checked on the device', () => {
    const local = { ...t, connectChecked: checkMarker(t, false) };
    expect(local.connectChecked).toBe(`local:${hashText(t.text)}`);
    expect(needsCheck(local, false)).toBe(false);
    expect(needsCheck(local, true)).toBe(true);
  });

  it('takes the newest thoughts first, a batch at a time', () => {
    const list = [thought('t1', 'a'), thought('t3', 'c'), thought('t2', 'b')];
    expect(nextToCheck(list, true, 2).map((x) => x.id)).toEqual(['t3', 't2']);
  });

  it("drops a re-checked thought's old suggestions, never the person's decisions", () => {
    const edited = { ...t, connectChecked: 'old-hash' };
    const fresh = thought('t2', 'New one');
    const conns = [
      connection('c1', 't1', 't5'),
      connection('c2', 't1', 't6', { status: 'accepted' }),
      connection('c3', 't7', 't1', { status: 'dismissed' }),
      connection('c4', 't2', 't8'),
    ];
    expect(staleSuggestions([edited, fresh], conns).map((c) => c.id)).toEqual(['c1']);
  });
});

describe('finding candidates by meaning', () => {
  const vectors = new Map<string, number[]>([
    ['a', [1, 0]],
    ['close', at(0.6)],
    ['related', at(0.29)],
    ['far', at(0.1)],
    ['known', at(0.7)],
  ]);

  it('keeps the closest thoughts above the floor and skips recorded pairs', () => {
    const excluded = recordedPairs([connection('c1', 'known', 'a', { status: 'dismissed' })]);
    const found = findCandidates('a', vectors, excluded);
    expect(found.map((c) => c.id)).toEqual(['close', 'related']);
    expect(found[0].score).toBeCloseTo(0.6);
  });

  it('keeps at most the top few', () => {
    expect(findCandidates('a', vectors, new Set(), 0.2, 1).map((c) => c.id)).toEqual(['known']);
  });

  it('without the AI, suggests only pairs very close in meaning', () => {
    const a = thought('a', 'Need a new car before winter');
    const thoughts = [a, thought('close', 'Look at second-hand cars'), thought('related', 'Winter tyres')];
    const links = localLinks(a, [{ id: 'close', score: 0.41 }, { id: 'related', score: 0.29 }], thoughts);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ otherId: 'close', kind: 'similar', reason: 'Both thoughts mention "car".', subject: 'car' });
  });

  it('on devices without the meaning model, falls back to shared words by stem', () => {
    const a = thought('a', 'Voting in the local elections');
    const thoughts = [a, thought('b', 'Who should I vote for in this election?'), thought('c', 'Local bakery')];
    const links = wordLinks(a, thoughts, new Set());
    expect(links.map((l) => l.otherId)).toEqual(['b']);
    expect(links[0].kind).toBe('shared-words');
    expect(wordLinks(a, thoughts, new Set([pairKey('a', 'b')]))).toEqual([]);
  });
});

describe("checking the AI's answer", () => {
  const asked = new Map([
    [pairKey('v1', 'v2'), { thoughtId: 'v1', otherId: 'v2', score: 0.29 }],
    [pairKey('v1', 'v3'), { thoughtId: 'v1', otherId: 'v3', score: 0.31 }],
  ]);

  it('keeps well-formed links between pairs that were asked about, once each', () => {
    const links = linksFromAi(
      [
        { thoughtId: 'v2', candidateId: 'v1', kind: 'shared-theme', subject: 'elections and voting', reason: 'Both are about voting.' },
        { thoughtId: 'v1', candidateId: 'v2', kind: 'same-subject', subject: 'voting', reason: 'Again.' },
        { thoughtId: 'v1', candidateId: 'v9', kind: 'same-subject', subject: 'x', reason: 'Never asked.' },
        { thoughtId: 'v1', candidateId: 'v3', kind: 'similar', subject: 'x', reason: 'Not an AI kind.' },
        { thoughtId: 'v1', candidateId: 'v3', kind: 'builds-on', subject: 'x', reason: '  ' },
        'nonsense',
      ],
      asked
    );
    expect(links).toEqual([
      { thoughtId: 'v1', otherId: 'v2', kind: 'shared-theme', subject: 'elections and voting', reason: 'Both are about voting.', score: 0.29 },
    ]);
  });

  it('treats anything but a list as no links', () => {
    expect(linksFromAi({ connections: 'nope' }, asked)).toEqual([]);
    expect(linksFromAi(null, asked)).toEqual([]);
  });
});

describe('showing suggestions', () => {
  const thoughts = ['a', 'b', 'c', 'd', 'e'].map((id) => thought(id, id));

  it('puts clear kinds of link before broad themes, then the closest in meaning', () => {
    const ranked = rankSuggestions(
      [
        connection('theme', 'a', 'b', { kind: 'shared-theme', score: 0.5 }),
        connection('feelings', 'a', 'c', { kind: 'different-feelings', score: 0.4 }),
        connection('subject', 'a', 'd', { kind: 'same-subject', score: 0.3 }),
        connection('accepted', 'a', 'e', { kind: 'same-subject', score: 0.9, status: 'accepted' }),
        connection('gone', 'a', 'zz', { kind: 'same-subject', score: 0.9 }),
      ],
      thoughts
    );
    expect(ranked.map((c) => c.id)).toEqual(['feelings', 'theme', 'subject']);
  });

  it('names the kind of link and what both are about', () => {
    expect(describeConnection({ kind: 'different-feelings', subject: 'working from home' })).toBe(
      'Different feelings · working from home'
    );
    expect(describeConnection({ kind: 'shared-words', subject: 'garden' })).toBe('Shared words');
    expect(describeConnection({})).toBe('');
  });
});
