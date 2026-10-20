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
 * A rough word stem, so "vote", "votes", "voted" and "voting" match. Only used by the
 * last-resort word matching on devices that can't run the meaning model.
 */
export function stemWord(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  for (const suffix of ['ingly', 'edly', 'ings', 'ing', 'ers', 'ed', 'er', 'es', 'ly', 's']) {
    if (suffix === 's' && w.endsWith('ss')) break;
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  // running -> runn -> run
  if (w.length > 3 && w[w.length - 1] === w[w.length - 2] && !'aeiouls'.includes(w[w.length - 1])) w = w.slice(0, -1);
  return w;
}

/** Meaningful words two texts share, compared by stem; reported as they appear in the first text. */
export function sharedWords(textA: string, textB: string): string[] {
  const stemsB = new Set(extractMeaningfulTokens(textB).map(stemWord));
  const shared = new Map<string, string>();
  for (const token of extractMeaningfulTokens(textA)) {
    const stem = stemWord(token);
    if (stemsB.has(stem) && !shared.has(stem)) shared.set(stem, token);
  }
  return [...shared.values()];
}
