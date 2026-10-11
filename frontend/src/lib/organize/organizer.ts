import { Collection, CollectionColorVariant, CollectionIconType, CollectionOrigin, OrganizeEvent, Thought } from '../../types';
import { IEmbeddingRepository, UpdateThoughtDTO } from '../../storage/types';
import { Embedder, hashText } from './embedder';
import {
  buildCollectionVectors,
  collectionLabel,
  CollectionVector,
  retrieveCandidates,
} from './retrieve';
import { Candidate, OrganizeDecision } from './types';

const EMBED_BATCH = 16;
const MAX_COLLECTIONS_IN_PROMPT = 40;

/** The subset of storage actions the organiser needs; implemented by StorageContext. */
export interface OrganizerActions {
  createCollection: (
    name: string,
    description?: string,
    options?: {
      colorVariant?: CollectionColorVariant;
      iconType?: CollectionIconType;
      origin?: CollectionOrigin;
      autoReason?: string;
    }
  ) => Promise<Collection>;
  updateThought: (id: string, updates: UpdateThoughtDTO) => Promise<Thought>;
  deleteCollection: (id: string) => Promise<void>;
}

function newId(prefix: string): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Makes sure every thought has an up-to-date embedding (re-embedding when the
 * text or model changed), removes embeddings of deleted thoughts, and returns
 * a thoughtId → vector map.
 */
export async function syncEmbeddings(
  embedder: Embedder,
  repo: IEmbeddingRepository,
  thoughts: Thought[]
): Promise<Map<string, number[]>> {
  const stored = new Map((await repo.getAll()).map((e) => [e.thoughtId, e]));
  const liveIds = new Set(thoughts.map((t) => t.id));
  const vectors = new Map<string, number[]>();
  const stale: Thought[] = [];

  for (const thought of thoughts) {
    const existing = stored.get(thought.id);
    if (existing && existing.modelId === embedder.modelId && existing.textHash === hashText(thought.text)) {
      vectors.set(thought.id, existing.vector);
    } else {
      stale.push(thought);
    }
  }

  for (let i = 0; i < stale.length; i += EMBED_BATCH) {
    const batch = stale.slice(i, i + EMBED_BATCH);
    const batchVectors = await embedder.embed(batch.map((t) => t.text));
    const now = new Date().toISOString();
    for (let j = 0; j < batch.length; j++) {
      const thought = batch[j];
      vectors.set(thought.id, batchVectors[j]);
      await repo.put({
        thoughtId: thought.id,
        modelId: embedder.modelId,
        textHash: hashText(thought.text),
        vector: batchVectors[j],
        updatedAt: now,
      });
    }
  }

  for (const id of stored.keys()) {
    if (!liveIds.has(id)) await repo.delete(id);
  }

  return vectors;
}

/**
 * Embeds "name: description" labels for collections. Cached in memory by label
 * hash because collections are few and labels rarely change.
 */
export async function embedCollectionLabels(
  embedder: Embedder,
  collections: Collection[],
  cache: Map<string, { hash: string; vector: number[] }>
): Promise<Map<string, number[]>> {
  const missing = collections.filter((c) => cache.get(c.id)?.hash !== hashText(collectionLabel(c)));
  if (missing.length > 0) {
    const vectors = await embedder.embed(missing.map(collectionLabel));
    missing.forEach((c, i) => cache.set(c.id, { hash: hashText(collectionLabel(c)), vector: vectors[i] }));
  }
  const result = new Map<string, number[]>();
  for (const c of collections) {
    const entry = cache.get(c.id);
    if (entry) result.set(c.id, entry.vector);
  }
  return result;
}

export interface PreparedClassification {
  thought: Thought;
  textHash: string;
  vector: number[];
  candidates: Candidate[];
  thoughtVectors: Map<string, number[]>;
  collectionVectors: Map<string, CollectionVector>;
}

/** Embeds what's needed and retrieves the top candidates for one thought. */
export async function prepareClassification(params: {
  thoughtId: string;
  thoughts: Thought[];
  collections: Collection[];
  embedder: Embedder;
  embeddingRepo: IEmbeddingRepository;
  labelCache: Map<string, { hash: string; vector: number[] }>;
}): Promise<PreparedClassification | null> {
  const { thoughtId, thoughts, collections, embedder, embeddingRepo, labelCache } = params;
  const thought = thoughts.find((t) => t.id === thoughtId);
  if (!thought) return null;

  const thoughtVectors = await syncEmbeddings(embedder, embeddingRepo, thoughts);
  const vector = thoughtVectors.get(thought.id);
  if (!vector) return null;

  const emptyCollections = collections.filter(
    (c) => !thoughts.some((t) => t.id !== thought.id && t.collectionIds?.includes(c.id))
  );
  const labelVectors = await embedCollectionLabels(embedder, emptyCollections, labelCache);
  const collectionVectors = buildCollectionVectors(
    collections,
    thoughts,
    thoughtVectors,
    labelVectors,
    thought.id
  );

  return {
    thought,
    textHash: hashText(thought.text),
    vector,
    candidates: retrieveCandidates(thought.id, vector, thoughtVectors, collectionVectors),
    thoughtVectors,
    collectionVectors,
  };
}

export interface ClassifyPayload {
  thought: { id: string; text: string };
  similarThoughts: { id: string; text: string; collections: string[]; ungrouped: boolean; similarity: number }[];
  collections: { id: string; name: string; description: string; similarity: number | null }[];
}

/** Builds the minimal request sent to /api/classify (only when Smart organising is on). */
export function buildClassifyPayload(
  prepared: PreparedClassification,
  thoughts: Thought[],
  collections: Collection[]
): ClassifyPayload {
  const thoughtById = new Map(thoughts.map((t) => [t.id, t]));
  const nameById = new Map(collections.map((c) => [c.id, c.name]));
  const collectionScores = new Map(
    prepared.candidates.filter((c) => c.kind === 'collection').map((c) => [c.id, c.score])
  );

  const similarThoughts = prepared.candidates
    .filter((c) => c.kind === 'thought')
    .map((c) => {
      const t = thoughtById.get(c.id)!;
      return {
        id: t.id,
        text: t.text,
        collections: t.collectionIds.map((id) => nameById.get(id)).filter((n): n is string => Boolean(n)),
        ungrouped: t.collectionIds.length === 0 && !t.organizeLocked,
        similarity: Math.round(c.score * 100) / 100,
      };
    });

  const sortedCollections = [...collections].sort(
    (a, b) => (collectionScores.get(b.id) ?? -1) - (collectionScores.get(a.id) ?? -1)
  );

  return {
    thought: { id: prepared.thought.id, text: prepared.thought.text },
    similarThoughts,
    collections: sortedCollections.slice(0, MAX_COLLECTIONS_IN_PROMPT).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || '',
      similarity: collectionScores.has(c.id) ? Math.round(collectionScores.get(c.id)! * 100) / 100 : null,
    })),
  };
}

/**
 * True when it's still safe to apply a decision computed earlier: the thought
 * exists, its text hasn't changed, and the user hasn't organised it by hand.
 */
export function isStillApplicable(thoughtId: string, textHash: string, thoughts: Thought[]): boolean {
  const thought = thoughts.find((t) => t.id === thoughtId);
  return Boolean(thought && !thought.organizeLocked && hashText(thought.text) === textHash);
}

/**
 * Applies an assign/create decision and returns the events to record.
 * Callers must have validated the decision against current state first.
 */
export async function applyDecision(
  thoughtId: string,
  decision: OrganizeDecision,
  thoughts: Thought[],
  collections: Collection[],
  actions: OrganizerActions
): Promise<OrganizeEvent[]> {
  const thought = thoughts.find((t) => t.id === thoughtId);
  if (!thought) return [];
  const now = new Date().toISOString();

  if (decision.action === 'assign') {
    const ids = decision.collectionIds.filter(
      (id) => !thought.collectionIds.includes(id) && collections.some((c) => c.id === id)
    );
    if (ids.length === 0) return [];
    await actions.updateThought(thought.id, {
      collectionIds: [...thought.collectionIds, ...ids],
      autoCollectionIds: [...(thought.autoCollectionIds || []), ...ids],
    });
    return ids.map((id) => ({
      id: newId('evt'),
      thoughtId: thought.id,
      action: 'assign' as const,
      collectionId: id,
      collectionName: collections.find((c) => c.id === id)?.name || 'Collection',
      reason: decision.reason,
      source: decision.source,
      createdAt: now,
    }));
  }

  if (decision.action === 'create') {
    const partner = thoughts.find((t) => t.id === decision.newCollection.partnerThoughtId);
    if (!partner) return [];
    const collection = await actions.createCollection(
      decision.newCollection.name,
      decision.newCollection.description || undefined,
      { origin: 'auto', autoReason: decision.reason, colorVariant: 'green', iconType: 'leaf' }
    );
    for (const member of [thought, partner]) {
      await actions.updateThought(member.id, {
        collectionIds: [...member.collectionIds, collection.id],
        autoCollectionIds: [...(member.autoCollectionIds || []), collection.id],
      });
    }
    return [
      {
        id: newId('evt'),
        thoughtId: thought.id,
        action: 'create',
        collectionId: collection.id,
        collectionName: collection.name,
        partnerThoughtId: partner.id,
        reason: decision.reason,
        source: decision.source,
        createdAt: now,
      },
    ];
  }

  return [];
}

/**
 * Reverses an organiser action. The affected thoughts are locked so the
 * organiser never repeats the decision the user just rejected. An auto-created
 * collection is deleted if nothing else has been added to it since.
 */
export async function undoOrganizeEvent(
  event: OrganizeEvent,
  thoughts: Thought[],
  collections: Collection[],
  actions: OrganizerActions
): Promise<void> {
  const affectedIds = [event.thoughtId, ...(event.partnerThoughtId ? [event.partnerThoughtId] : [])];

  for (const id of affectedIds) {
    const t = thoughts.find((x) => x.id === id);
    if (!t) continue;
    await actions.updateThought(t.id, {
      collectionIds: t.collectionIds.filter((cid) => cid !== event.collectionId),
      autoCollectionIds: (t.autoCollectionIds || []).filter((cid) => cid !== event.collectionId),
      organizeLocked: true,
    });
  }

  if (event.action === 'create') {
    const collection = collections.find((c) => c.id === event.collectionId);
    const otherMembers = thoughts.filter(
      (t) => !affectedIds.includes(t.id) && t.collectionIds.includes(event.collectionId)
    );
    if (collection && collection.origin === 'auto' && otherMembers.length === 0) {
      await actions.deleteCollection(collection.id);
    }
  }
}

export { newId as createOrganizeId };
