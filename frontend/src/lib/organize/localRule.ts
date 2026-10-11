import { Collection, Thought } from '../../types';
import { extractMeaningfulTokens } from '../connections';
import { CollectionVector, cosineSimilarity } from './retrieve';
import { Candidate, OrganizeDecision, ORGANIZE_THRESHOLDS } from './types';

export interface LocalRuleInput {
  thought: Thought;
  vector: number[];
  candidates: Candidate[];
  thoughts: Thought[];
  collections: Collection[];
  thoughtVectors: Map<string, number[]>;
  collectionVectors: Map<string, CollectionVector>;
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Suggests a collection name from words two thoughts share. Deliberately plain:
 * the user is asked to confirm or edit it before anything is created.
 */
export function suggestGroupName(textA: string, textB: string): { name: string; description: string } {
  const tokensB = new Set(extractMeaningfulTokens(textB));
  const shared = extractMeaningfulTokens(textA).filter((t) => tokensB.has(t));
  if (shared.length === 0) {
    return { name: 'Related thoughts', description: 'Two thoughts that seem to belong together.' };
  }
  const top = shared.slice(0, 2);
  return {
    name: top.map(titleCase).join(' & '),
    description: `Thoughts about ${top.join(' and ')}.`,
  };
}

/**
 * Deterministic fallback used when Smart organising is off, offline, or the LLM fails.
 *
 * - Case A: assign to a collection whose centroid is close AND which has at least
 *   two individually close members (empty collections are left to the LLM).
 * - Case B: if a close thought is ungrouped, propose a group — never auto-create,
 *   because a good name needs either the LLM or the user.
 * - Case D: otherwise leave the thought ungrouped.
 */
export function decideLocally(input: LocalRuleInput): OrganizeDecision {
  const { thought, vector, candidates, thoughts, collectionVectors, thoughtVectors } = input;
  const byId = new Map(thoughts.map((t) => [t.id, t]));

  // Case A
  for (const candidate of candidates) {
    if (candidate.kind !== 'collection' || candidate.score < ORGANIZE_THRESHOLDS.assign) continue;
    if (thought.collectionIds.includes(candidate.id)) continue;
    const cv = collectionVectors.get(candidate.id);
    if (!cv || cv.memberIds.length < ORGANIZE_THRESHOLDS.minMembers) continue;

    const closeMembers = cv.memberIds.filter((id) => {
      const v = thoughtVectors.get(id);
      return v ? cosineSimilarity(vector, v) >= ORGANIZE_THRESHOLDS.pair : false;
    });
    if (closeMembers.length >= ORGANIZE_THRESHOLDS.minMembers) {
      return {
        action: 'assign',
        collectionIds: [candidate.id],
        reason: `Similar to ${closeMembers.length} thoughts already in this collection.`,
        source: 'local',
      };
    }
  }

  // Case B
  for (const candidate of candidates) {
    if (candidate.kind !== 'thought' || candidate.score < ORGANIZE_THRESHOLDS.group) continue;
    const partner = byId.get(candidate.id);
    if (!partner || partner.organizeLocked || partner.collectionIds.length > 0) continue;
    const { name, description } = suggestGroupName(thought.text, partner.text);
    return {
      action: 'suggest-group',
      partnerThoughtId: partner.id,
      name,
      description,
      reason: 'These two thoughts read as closely related.',
      source: 'local',
    };
  }

  return { action: 'none', reason: 'No close match yet.', source: 'local' };
}
