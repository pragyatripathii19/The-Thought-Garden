import { Collection, Connection, GrowthStage, Thought } from '../types';

/**
 * How thoughts grow (seed → sprout → bloom → mature).
 *
 * - Seed: every new thought.
 * - Sprout: you came back to it — edited it, saved it, added it to a collection
 *   (or auto-organising did), or connected it to another thought.
 * - Bloom: it's connected to at least one thought AND has grown — edited twice
 *   or more, 300+ characters, or in 2+ collections.
 * - Mature: only when you choose it; no signal can tell when an idea is done.
 *
 * Stages only move forward automatically, and a stage you pick yourself always wins.
 */

export const GROWTH_RULES = {
  bloomLength: 300,
  bloomEdits: 2,
  bloomCollections: 2,
} as const;

const RANK: Record<GrowthStage, number> = { seed: 0, sprout: 1, bloom: 2, mature: 3 };

export interface GrowthSignals {
  edits: number;
  saved: boolean;
  collections: number;
  connections: number;
  length: number;
}

export function growthSignals(thought: Thought, connections: Connection[]): GrowthSignals {
  return {
    edits: thought.editCount || 0,
    saved: Boolean(thought.isSaved),
    collections: thought.collectionIds.length,
    connections: connections.filter(
      (c) => c.status === 'accepted' && (c.sourceThoughtId === thought.id || c.targetThoughtId === thought.id)
    ).length,
    length: thought.text.trim().length,
  };
}

function hasGrown(s: GrowthSignals): boolean {
  return (
    s.edits >= GROWTH_RULES.bloomEdits ||
    s.length >= GROWTH_RULES.bloomLength ||
    s.collections >= GROWTH_RULES.bloomCollections
  );
}

function isTended(s: GrowthSignals): boolean {
  return s.edits > 0 || s.saved || s.collections > 0 || s.connections > 0;
}

/** The highest stage the signals alone justify (never Mature). */
export function earnedStage(s: GrowthSignals): GrowthStage {
  if (s.connections > 0 && hasGrown(s)) return 'bloom';
  if (isTended(s)) return 'sprout';
  return 'seed';
}

/**
 * The stage a thought should be at now, or null if it should stay as it is
 * (hand-picked stage, or nothing new earned). Never moves a thought backwards.
 */
export function evolvedStage(thought: Thought, connections: Connection[]): GrowthStage | null {
  if (thought.stageManual) return null;
  const current = thought.stage || 'seed';
  const earned = earnedStage(growthSignals(thought, connections));
  return RANK[earned] > RANK[current] ? earned : null;
}

export interface GrowthStory {
  /** Why it's at its current stage. */
  why: string;
  /** What would help it grow next, if anything. */
  next: string | null;
}

/** A plain-language explanation of a thought's stage, for the detail view. */
export function describeGrowth(thought: Thought, connections: Connection[], collections: Collection[] = []): GrowthStory {
  const stage = thought.stage || 'seed';
  const s = growthSignals(thought, connections);

  if (thought.stageManual) {
    return {
      why: 'You chose this stage, so it won’t change on its own.',
      next: stage === 'mature' ? null : 'Let it grow automatically again to have the garden move it forward as you tend it.',
    };
  }

  if (stage === 'mature') return { why: 'You marked this idea as mature.', next: null };

  if (stage === 'bloom') {
    return {
      why: 'In bloom: it’s connected to another thought and has grown.',
      next: 'Mark it Mature when the idea feels complete.',
    };
  }

  if (stage === 'sprout') {
    const firstCollection = collections.find((c) => thought.collectionIds.includes(c.id));
    const why =
      s.connections > 0
        ? 'Sprouted when you connected it to another thought.'
        : firstCollection
        ? `Sprouted when it joined “${firstCollection.name}”.`
        : s.collections > 0
        ? 'Sprouted when it joined a collection.'
        : s.edits > 0
        ? 'Sprouted when you came back and edited it.'
        : s.saved
        ? 'Sprouted when you saved it.'
        : 'Sprouting.';
    const needs: string[] = [];
    if (s.connections === 0) needs.push('connect it to another thought');
    if (!hasGrown(s)) needs.push('keep developing it (edit it again or write more)');
    return {
      why,
      next: needs.length ? `To bloom: ${needs.join(' and ')}.` : 'It’s ready to bloom.',
    };
  }

  return {
    why: 'Just planted.',
    next: 'To sprout: edit it, save it, add it to a collection or connect it to another thought.',
  };
}
