import { Collection, Thought } from '../../types';
import { Candidate, ORGANIZE_THRESHOLDS } from './types';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const sum = new Array(vectors[0].length).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < v.length; i++) sum[i] += v[i];
  }
  return sum.map((x) => x / vectors.length);
}

export interface CollectionVector {
  vector: number[];
  /** Member thoughts (with embeddings) that contributed to the vector. */
  memberIds: string[];
}

/**
 * Represents each collection as a vector: the mean of its members' embeddings,
 * or — for empty collections such as the starter ones — the embedding of its
 * "name: description" label.
 */
export function buildCollectionVectors(
  collections: Collection[],
  thoughts: Thought[],
  thoughtVectors: Map<string, number[]>,
  labelVectors: Map<string, number[]>,
  excludeThoughtId?: string
): Map<string, CollectionVector> {
  const result = new Map<string, CollectionVector>();
  for (const collection of collections) {
    const memberIds = thoughts
      .filter((t) => t.id !== excludeThoughtId && t.collectionIds?.includes(collection.id))
      .map((t) => t.id)
      .filter((id) => thoughtVectors.has(id));

    if (memberIds.length > 0) {
      result.set(collection.id, {
        vector: meanVector(memberIds.map((id) => thoughtVectors.get(id)!)),
        memberIds,
      });
    } else {
      const label = labelVectors.get(collection.id);
      if (label) result.set(collection.id, { vector: label, memberIds: [] });
    }
  }
  return result;
}

/** Text used to embed a collection that has no member thoughts yet. */
export function collectionLabel(collection: Collection): string {
  return collection.description ? `${collection.name}: ${collection.description}` : collection.name;
}

/**
 * Returns the top-K thoughts and collections most similar to the target vector,
 * ignoring anything below the similarity floor. Retrieval only proposes
 * candidates; it never decides membership by itself.
 */
export function retrieveCandidates(
  targetThoughtId: string,
  targetVector: number[],
  thoughtVectors: Map<string, number[]>,
  collectionVectors: Map<string, CollectionVector>,
  topK: number = ORGANIZE_THRESHOLDS.topK,
  floor: number = ORGANIZE_THRESHOLDS.floor
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const [id, vector] of thoughtVectors) {
    if (id === targetThoughtId) continue;
    const score = cosineSimilarity(targetVector, vector);
    if (score >= floor) candidates.push({ kind: 'thought', id, score });
  }

  for (const [id, { vector }] of collectionVectors) {
    const score = cosineSimilarity(targetVector, vector);
    if (score >= floor) candidates.push({ kind: 'collection', id, score });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, topK);
}
