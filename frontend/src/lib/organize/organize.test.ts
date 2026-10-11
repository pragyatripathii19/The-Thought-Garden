import { describe, it, expect, beforeEach } from 'vitest';
import { Collection, Thought } from '../../types';
import { InMemoryThoughtRepository } from '../../storage/memory/InMemoryThoughtRepository';
import { InMemoryCollectionRepository } from '../../storage/memory/InMemoryCollectionRepository';
import { InMemoryEmbeddingRepository } from '../../storage/memory/InMemoryEmbeddingRepository';
import { applyThoughtUpdate } from '../../storage/types';
import { Embedder, hashText } from './embedder';
import { buildCollectionVectors, cosineSimilarity, meanVector, retrieveCandidates } from './retrieve';
import { decideLocally, suggestGroupName } from './localRule';
import { validateDecision } from './validateDecision';
import {
  OrganizerActions,
  applyDecision,
  buildClassifyPayload,
  isStillApplicable,
  prepareClassification,
  syncEmbeddings,
  undoOrganizeEvent,
} from './organizer';
import { SerialQueue } from './queue';
import { validateGardenBackup, serializeGardenBackup } from '../portability';

/** Deterministic embedder: looks vectors up by text, counting calls. */
class FakeEmbedder implements Embedder {
  readonly modelId = 'fake-model';
  calls = 0;
  constructor(private table: Record<string, number[]>, private fallback: number[] = [0, 0, 0, 1]) {}
  async embed(texts: string[]): Promise<number[][]> {
    this.calls += texts.length;
    return texts.map((t) => this.table[t] ?? this.fallback);
  }
}

const now = '2026-10-10T10:00:00.000Z';
function thought(id: string, text: string, extra: Partial<Thought> = {}): Thought {
  return { id, text, createdAt: now, updatedAt: now, collectionIds: [], ...extra };
}
function collection(id: string, name: string, extra: Partial<Collection> = {}): Collection {
  return { id, name, createdAt: now, updatedAt: now, ...extra };
}

// Topic axes: [gardening, writing, finance, other]
const GARDEN_A = 'Compost makes the soil in my garden beds richer';
const GARDEN_B = 'Garden soil needs more compost before spring';
const GARDEN_C = 'Planting tomatoes in compost-rich garden soil';
const WRITING = 'Essay draft about slow mornings';
const FINANCE = 'Review the monthly budget spreadsheet';
const VECTORS: Record<string, number[]> = {
  [GARDEN_A]: [1, 0, 0, 0],
  [GARDEN_B]: [0.95, 0.05, 0, 0],
  [GARDEN_C]: [0.9, 0.1, 0, 0],
  [WRITING]: [0, 1, 0, 0],
  [FINANCE]: [0, 0, 1, 0],
};

describe('retrieval math', () => {
  it('computes cosine similarity and mean vectors', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(meanVector([[1, 0], [0, 1]])).toEqual([0.5, 0.5]);
  });

  it('retrieves top-K above the floor and never returns the thought itself', () => {
    const vectors = new Map(Object.entries({ a: [1, 0, 0, 0], b: [0.9, 0.1, 0, 0], c: [0, 1, 0, 0] }));
    const result = retrieveCandidates('a', [1, 0, 0, 0], vectors, new Map(), 10, 0.35);
    expect(result.map((r) => r.id)).toEqual(['b']);
    const limited = retrieveCandidates('x', [1, 0, 0, 0], vectors, new Map(), 1, 0);
    expect(limited).toHaveLength(1);
  });

  it('represents collections by member mean, or by label when empty', () => {
    const thoughts = [thought('a', GARDEN_A, { collectionIds: ['garden'] }), thought('b', GARDEN_B, { collectionIds: ['garden'] })];
    const tv = new Map([['a', VECTORS[GARDEN_A]], ['b', VECTORS[GARDEN_B]]]);
    const labels = new Map([['empty', [0, 1, 0, 0]]]);
    const cv = buildCollectionVectors([collection('garden', 'Garden'), collection('empty', 'Writing')], thoughts, tv, labels);
    expect(cv.get('garden')?.memberIds).toEqual(['a', 'b']);
    expect(cv.get('empty')?.memberIds).toEqual([]);
    expect(cv.get('empty')?.vector).toEqual([0, 1, 0, 0]);
  });
});

describe('local rule', () => {
  function setup(thoughts: Thought[], collections: Collection[], targetId: string) {
    const tv = new Map(thoughts.map((t) => [t.id, VECTORS[t.text]]));
    const cv = buildCollectionVectors(collections, thoughts, tv, new Map(), targetId);
    const target = thoughts.find((t) => t.id === targetId)!;
    const candidates = retrieveCandidates(targetId, tv.get(targetId)!, tv, cv);
    return { thought: target, vector: tv.get(targetId)!, candidates, thoughts, collections, thoughtVectors: tv, collectionVectors: cv };
  }

  it('Case A: assigns to a collection with two close members', () => {
    const thoughts = [
      thought('a', GARDEN_A, { collectionIds: ['garden'] }),
      thought('b', GARDEN_B, { collectionIds: ['garden'] }),
      thought('new', GARDEN_C),
    ];
    const decision = decideLocally(setup(thoughts, [collection('garden', 'Garden')], 'new'));
    expect(decision).toMatchObject({ action: 'assign', collectionIds: ['garden'], source: 'local' });
  });

  it('Case B: suggests (never auto-creates) a group with a close ungrouped thought', () => {
    const thoughts = [thought('a', GARDEN_A), thought('new', GARDEN_B)];
    const decision = decideLocally(setup(thoughts, [], 'new'));
    expect(decision.action).toBe('suggest-group');
    if (decision.action === 'suggest-group') {
      expect(decision.partnerThoughtId).toBe('a');
      expect(decision.name).toBe('Garden & Soil');
    }
  });

  it('Case B: never pairs with a thought the user organised by hand', () => {
    const thoughts = [thought('a', GARDEN_A, { organizeLocked: true }), thought('new', GARDEN_B)];
    expect(decideLocally(setup(thoughts, [], 'new')).action).toBe('none');
  });

  it('Case D: leaves an unrelated thought ungrouped', () => {
    const thoughts = [thought('a', GARDEN_A), thought('w', WRITING), thought('new', FINANCE)];
    expect(decideLocally(setup(thoughts, [], 'new')).action).toBe('none');
  });

  it('names a suggested group from shared words, with a neutral fallback', () => {
    expect(suggestGroupName('Urban forest walk', 'Planting an urban forest').name).toBe('Urban & Forest');
    expect(suggestGroupName('apples', 'oranges').name).toBe('Related thoughts');
  });
});

describe('LLM decision validation', () => {
  const thoughts = [thought('new', GARDEN_C), thought('a', GARDEN_A), thought('g', WRITING, { collectionIds: ['col-writing'] })];
  const collections = [collection('col-writing', 'Writing')];
  const ctx = { thought: thoughts[0], candidateThoughtIds: new Set(['a', 'g']), thoughts, collections };

  it('rejects malformed or unknown responses', () => {
    expect(validateDecision(null, ctx).action).toBe('none');
    expect(validateDecision({ action: 'explode' }, ctx).action).toBe('none');
  });

  it('drops collection ids the model invented', () => {
    expect(validateDecision({ action: 'assign', collectionIds: ['col-made-up'] }, ctx).action).toBe('none');
    expect(validateDecision({ action: 'assign', collectionIds: ['col-writing', 'nope'] }, ctx)).toMatchObject({
      action: 'assign',
      collectionIds: ['col-writing'],
    });
  });

  it('requires a valid, ungrouped partner from the candidates to create', () => {
    const noPartner = { action: 'create', newCollection: { name: 'Soil', partnerThoughtId: 'unknown' } };
    expect(validateDecision(noPartner, ctx).action).toBe('none');
    const groupedPartner = { action: 'create', newCollection: { name: 'Soil', partnerThoughtId: 'g' } };
    expect(validateDecision(groupedPartner, ctx).action).toBe('none');
    const valid = { action: 'create', newCollection: { name: 'Soil care', description: 'Compost notes', partnerThoughtId: 'a' } };
    expect(validateDecision(valid, ctx)).toMatchObject({ action: 'create', newCollection: { name: 'Soil care', partnerThoughtId: 'a' } });
  });

  it('turns a duplicate "new" collection name into an assignment', () => {
    const dup = { action: 'create', newCollection: { name: '  writing ', partnerThoughtId: 'a' } };
    expect(validateDecision(dup, ctx)).toMatchObject({ action: 'assign', collectionIds: ['col-writing'] });
  });
});

describe('embedding sync', () => {
  it('embeds only missing or changed thoughts and removes orphans', async () => {
    const repo = new InMemoryEmbeddingRepository();
    const embedder = new FakeEmbedder(VECTORS);
    const thoughts = [thought('a', GARDEN_A), thought('b', GARDEN_B)];

    await syncEmbeddings(embedder, repo, thoughts);
    expect(embedder.calls).toBe(2);

    await syncEmbeddings(embedder, repo, thoughts);
    expect(embedder.calls).toBe(2); // cached

    const edited = [thought('a', WRITING), thoughts[1]];
    const vectors = await syncEmbeddings(embedder, repo, edited);
    expect(embedder.calls).toBe(3); // only the edited one
    expect(vectors.get('a')).toEqual(VECTORS[WRITING]);

    await syncEmbeddings(embedder, repo, [edited[1]]);
    expect(await repo.get('a')).toBeNull(); // orphan removed
  });

  it('prepares candidates end-to-end and builds a minimal payload', async () => {
    const thoughts = [thought('new', GARDEN_C), thought('a', GARDEN_A), thought('f', FINANCE)];
    const collections = [collection('col-writing', 'Writing', { description: 'Blog drafts' })];
    const prepared = await prepareClassification({
      thoughtId: 'new',
      thoughts,
      collections,
      embedder: new FakeEmbedder({ ...VECTORS, 'Writing: Blog drafts': [0, 1, 0, 0] }),
      embeddingRepo: new InMemoryEmbeddingRepository(),
      labelCache: new Map(),
    });
    expect(prepared?.candidates.map((c) => c.id)).toEqual(['a']);

    const payload = buildClassifyPayload(prepared!, thoughts, collections);
    expect(payload.thought).toEqual({ id: 'new', text: GARDEN_C });
    expect(payload.similarThoughts).toHaveLength(1);
    expect(payload.similarThoughts[0]).toMatchObject({ id: 'a', ungrouped: true });
    expect(payload.collections[0]).toMatchObject({ id: 'col-writing', similarity: null });
  });
});

describe('applying and undoing decisions', () => {
  let thoughtRepo: InMemoryThoughtRepository;
  let colRepo: InMemoryCollectionRepository;
  let actions: OrganizerActions;

  beforeEach(() => {
    thoughtRepo = new InMemoryThoughtRepository();
    colRepo = new InMemoryCollectionRepository();
    actions = {
      createCollection: (name, description, options) => colRepo.create({ name, description, ...options }),
      updateThought: (id, updates) => thoughtRepo.update(id, updates),
      deleteCollection: (id) => colRepo.delete(id),
    };
  });

  it('assigns with an auto marker, and undo removes it and locks the thought', async () => {
    const col = await colRepo.create({ name: 'Garden' });
    const t = await thoughtRepo.create({ text: GARDEN_A });
    const events = await applyDecision(
      t.id,
      { action: 'assign', collectionIds: [col.id], reason: 'fits', source: 'local' },
      await thoughtRepo.getAll(),
      await colRepo.getAll(),
      actions
    );
    expect(events).toHaveLength(1);
    let stored = await thoughtRepo.getById(t.id);
    expect(stored?.collectionIds).toEqual([col.id]);
    expect(stored?.autoCollectionIds).toEqual([col.id]);

    await undoOrganizeEvent(events[0], await thoughtRepo.getAll(), await colRepo.getAll(), actions);
    stored = await thoughtRepo.getById(t.id);
    expect(stored?.collectionIds).toEqual([]);
    expect(stored?.autoCollectionIds).toEqual([]);
    expect(stored?.organizeLocked).toBe(true);
    expect(await colRepo.count()).toBe(1); // existing collections are never deleted by undo
  });

  it('creates an auto collection with both thoughts; undo deletes it if untouched', async () => {
    const a = await thoughtRepo.create({ text: GARDEN_A });
    const b = await thoughtRepo.create({ text: GARDEN_B });
    const events = await applyDecision(
      b.id,
      { action: 'create', newCollection: { name: 'Soil care', description: 'Compost', partnerThoughtId: a.id }, reason: 'shared theme', source: 'llm' },
      await thoughtRepo.getAll(),
      await colRepo.getAll(),
      actions
    );
    const [created] = await colRepo.getAll();
    expect(created).toMatchObject({ name: 'Soil care', origin: 'auto', autoReason: 'shared theme' });
    expect((await thoughtRepo.getById(a.id))?.collectionIds).toEqual([created.id]);
    expect((await thoughtRepo.getById(b.id))?.collectionIds).toEqual([created.id]);

    await undoOrganizeEvent(events[0], await thoughtRepo.getAll(), await colRepo.getAll(), actions);
    expect(await colRepo.count()).toBe(0);
    expect((await thoughtRepo.getById(a.id))?.organizeLocked).toBe(true);
    expect((await thoughtRepo.getById(b.id))?.organizeLocked).toBe(true);
  });

  it('keeps an auto collection on undo if the user added more thoughts to it', async () => {
    const a = await thoughtRepo.create({ text: GARDEN_A });
    const b = await thoughtRepo.create({ text: GARDEN_B });
    const events = await applyDecision(
      b.id,
      { action: 'create', newCollection: { name: 'Soil care', description: '', partnerThoughtId: a.id }, reason: 'r', source: 'llm' },
      await thoughtRepo.getAll(),
      await colRepo.getAll(),
      actions
    );
    const [created] = await colRepo.getAll();
    await thoughtRepo.create({ text: GARDEN_C, collectionIds: [created.id] });

    await undoOrganizeEvent(events[0], await thoughtRepo.getAll(), await colRepo.getAll(), actions);
    expect(await colRepo.count()).toBe(1);
  });

  it('does not apply stale decisions after an edit or a manual change', () => {
    const t = thought('a', GARDEN_A);
    const hash = hashText(GARDEN_A);
    expect(isStillApplicable('a', hash, [t])).toBe(true);
    expect(isStillApplicable('a', hash, [{ ...t, text: 'edited' }])).toBe(false);
    expect(isStillApplicable('a', hash, [{ ...t, organizeLocked: true }])).toBe(false);
    expect(isStillApplicable('a', hash, [])).toBe(false);
  });
});

describe('storage and portability compatibility', () => {
  it('organiser bookkeeping does not count as tending a thought', () => {
    const t = thought('a', GARDEN_A);
    expect(applyThoughtUpdate(t, { classifyState: 'done' }).updatedAt).toBe(now);
    expect(applyThoughtUpdate(t, { collectionIds: ['x'] }).updatedAt).not.toBe(now);
  });

  it('round-trips the new optional fields through backup validation', () => {
    const t = thought('a', GARDEN_A, { collectionIds: ['c'], autoCollectionIds: ['c'], organizeLocked: true, classifyState: 'done' });
    const c = collection('c', 'Soil care', { origin: 'auto', autoReason: 'shared theme' });
    const result = validateGardenBackup(serializeGardenBackup([t], [c], []));
    expect(result.valid).toBe(true);
    expect(result.backup?.garden.thoughts[0]).toMatchObject({ autoCollectionIds: ['c'], organizeLocked: true });
    expect(result.backup?.garden.collections[0]).toMatchObject({ origin: 'auto' });
  });

  it('still accepts backups made before automatic organising existed', () => {
    const legacy = JSON.stringify({
      version: 1,
      exportedAt: now,
      garden: { thoughts: [{ id: 'a', text: 'Old thought', createdAt: now, updatedAt: now, collectionIds: [] }], collections: [], connections: [] },
    });
    expect(validateGardenBackup(legacy).valid).toBe(true);
  });
});

describe('SerialQueue', () => {
  it('runs tasks one at a time and skips duplicates that are still queued', async () => {
    const queue = new SerialQueue();
    const log: string[] = [];
    let active = 0;
    let maxActive = 0;
    const task = (name: string) => async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      log.push(name);
      active--;
    };
    queue.enqueue('a', task('a'));
    queue.enqueue('a', task('a-dup'));
    await queue.enqueue('b', task('b'));
    expect(log).toEqual(['a', 'b']);
    expect(maxActive).toBe(1);
  });
});
