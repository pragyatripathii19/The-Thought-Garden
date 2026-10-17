import { OrganizeEventSource } from '../../types';

/** A retrieval hit: an existing thought or collection similar to the new thought. */
export interface Candidate {
  kind: 'thought' | 'collection';
  id: string;
  score: number;
}

/** What the organiser decided for a thought, after validation. */
export type OrganizeDecision =
  | { action: 'assign'; collectionIds: string[]; reason: string; source: OrganizeEventSource }
  | {
      action: 'create';
      newCollection: { name: string; description: string; partnerThoughtId: string };
      reason: string;
      source: OrganizeEventSource;
    }
  | {
      /** Local rule only: two thoughts look related but naming needs the user. */
      action: 'suggest-group';
      partnerThoughtId: string;
      name: string;
      description: string;
      reason: string;
      source: 'local';
    }
  | {
      action: 'none';
      reason: string;
      source: OrganizeEventSource;
      /** The AI's answer was unusable (bad ids, missing name…); use the on-device rule instead. */
      rejected?: boolean;
    };

/** A pending "group these two thoughts?" card produced by the local rule. */
export interface GroupSuggestion {
  id: string;
  thoughtId: string;
  partnerThoughtId: string;
  name: string;
  description: string;
  reason: string;
  createdAt: string;
}

/**
 * Tunable thresholds (cosine similarity, normalised embeddings).
 *
 * Calibrated on sample thoughts with all-MiniLM-L6-v2 (q8): clearly related short
 * thoughts score ~0.40–0.50, loosely related ones ~0.28–0.33, unrelated ones
 * ~0.10–0.16. Re-tune on real pilot thoughts.
 */
export const ORGANIZE_THRESHOLDS = {
  /**
   * Retrieval floor. Kept generous because the LLM makes the final call; if no
   * candidate clears it, the thought stays ungrouped and no LLM call is made.
   */
  floor: 0.25,
  /** Collection centroid similarity needed for a local assignment. */
  assign: 0.45,
  /** Per-member similarity; at least `minMembers` members must reach it. */
  pair: 0.4,
  minMembers: 2,
  /** Thought-to-thought similarity for a local "group these?" suggestion (user confirms). */
  group: 0.45,
  topK: 10,
} as const;
