import { Thought, Connection } from '../types';

export const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
  'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
  // Common filler verbs & adverbs
  'really', 'think', 'also', 'maybe', 'much', 'even', 'want', 'like', 'going', 'know', 'thing', 'things'
]);

/**
 * Extracts normalized, unique meaningful keywords from text,
 * filtering out common stop-words and tokens under 3 characters.
 */
export function extractMeaningfulTokens(text: string): string[] {
  if (!text) return [];

  const rawTokens = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);

  const meaningful = new Set<string>();
  for (const token of rawTokens) {
    if (!ENGLISH_STOP_WORDS.has(token)) {
      meaningful.add(token);
    }
  }

  return Array.from(meaningful);
}

export interface SuggestedConnection {
  sourceThought: Thought;
  targetThought: Thought;
  sharedTokens: string[];
  reason: string;
  score: number;
}

/**
 * Generates an explainable reason grounded in the shared terms.
 */
export function formatConnectionReason(sharedTokens: string[]): string {
  if (sharedTokens.length === 0) return 'Both thoughts share similar themes.';
  if (sharedTokens.length === 1) return `Both thoughts mention "${sharedTokens[0]}".`;
  if (sharedTokens.length === 2) {
    return `Both thoughts mention "${sharedTokens[0]}" and "${sharedTokens[1]}".`;
  }
  return `Both thoughts mention "${sharedTokens[0]}", "${sharedTokens[1]}", and "${sharedTokens[2]}".`;
}

/**
 * Discovers the best connection candidate among the thoughts.
 * Conservative threshold: requires at least 2 distinct meaningful shared tokens.
 * Excludes self-links and any pair that has already been recorded (accepted or dismissed).
 */
export function findTopSuggestedConnection(
  thoughts: Thought[],
  existingConnections: Connection[]
): SuggestedConnection | null {
  if (thoughts.length < 2) return null;

  // Build a lookup set of existing pairs (unordered)
  const existingPairs = new Set<string>();
  for (const conn of existingConnections) {
    const pairKey1 = `${conn.sourceThoughtId}:::${conn.targetThoughtId}`;
    const pairKey2 = `${conn.targetThoughtId}:::${conn.sourceThoughtId}`;
    existingPairs.add(pairKey1);
    existingPairs.add(pairKey2);
  }

  // Pre-tokenize thoughts
  const tokenMap = new Map<string, string[]>();
  for (const thought of thoughts) {
    tokenMap.set(thought.id, extractMeaningfulTokens(thought.text));
  }

  const candidates: SuggestedConnection[] = [];

  for (let i = 0; i < thoughts.length; i++) {
    for (let j = i + 1; j < thoughts.length; j++) {
      const t1 = thoughts[i];
      const t2 = thoughts[j];

      // Exclude already recorded pairs
      const pairKey = `${t1.id}:::${t2.id}`;
      if (existingPairs.has(pairKey)) continue;

      const tokens1 = tokenMap.get(t1.id) || [];
      const tokens2 = tokenMap.get(t2.id) || [];

      // Find shared tokens
      const shared = tokens1.filter((t) => tokens2.includes(t));

      // Conservative threshold: require at least 2 shared meaningful words
      if (shared.length >= 2) {
        const unionSize = new Set([...tokens1, ...tokens2]).size;
        const jaccardScore = unionSize > 0 ? shared.length / unionSize : 0;

        candidates.push({
          sourceThought: t1,
          targetThought: t2,
          sharedTokens: shared,
          reason: formatConnectionReason(shared),
          score: jaccardScore,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort descending by score, then by shared tokens count
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.sharedTokens.length - a.sharedTokens.length;
  });

  return candidates[0];
}
