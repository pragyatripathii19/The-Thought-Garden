import { Thought } from '../types';

/**
 * Gentle Rediscovery Algorithm:
 * Selects an older thought to surface on the Garden home page.
 * 
 * Rules:
 * 1. Requires at least 3 thoughts in the garden.
 * 2. Excludes thoughts that the user dismissed during the current session.
 * 3. Never surfaces the 2 most recently created thoughts (gives space before rediscovery).
 * 4. Selects a candidate from the remaining older thoughts.
 */
export function pickThoughtToRevisit(
  thoughts: Thought[],
  dismissedIds: Set<string> = new Set()
): Thought | null {
  if (!thoughts || thoughts.length < 3) {
    return null;
  }

  // Sort chronologically ascending (oldest first)
  const sorted = [...thoughts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // The 2 newest thoughts shouldn't be surfaced for rediscovery
  const olderCandidates = sorted.slice(0, sorted.length - 2);

  // Exclude dismissed thoughts
  const eligible = olderCandidates.filter((t) => !dismissedIds.has(t.id));

  if (eligible.length === 0) {
    return null;
  }

  // Pick randomly from eligible candidates for variety
  return eligible[Math.floor(Math.random() * eligible.length)];
}
