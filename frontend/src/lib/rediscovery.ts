import { Thought } from '../types';

/**
 * Gentle Rediscovery Algorithm:
 * Selects an older thought to surface on the Garden home page.
 * 
 * Rules:
 * 1. Requires at least 3 thoughts in the garden.
 * 2. Excludes thoughts that the user dismissed during the current session.
 * 3. Never surfaces the 2 most recently created thoughts (gives space before rediscovery).
 * 4. Keeps the current pick while it is still eligible, so the card doesn't
 *    change every time a thought is added or edited.
 * 5. Otherwise selects a random candidate from the remaining older thoughts.
 */
export function pickThoughtToRevisit(
  thoughts: Thought[],
  dismissedIds: Set<string> = new Set(),
  currentId: string | null = null
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

  const current = currentId ? eligible.find((t) => t.id === currentId) : undefined;
  if (current) {
    return current;
  }

  // Pick randomly from eligible candidates for variety
  return eligible[Math.floor(Math.random() * eligible.length)];
}
