import { Connection, ConnectionKind, Thought } from '../../types';
import { hashText } from '../organize/embedder';
import { cosineSimilarity } from '../organize/retrieve';
import { formatConnectionReason, sharedWords } from '../connections';

/**
 * Calibrated on 40 labelled pairs of thoughts with all-MiniLM-L6-v2 (q8):
 * - related pairs scored 0.20–0.74 (elections / registering to vote: 0.29), and 23 of 24 had their
 *   partner among the 5 closest thoughts, so the AI judges the top 5 above 0.20;
 * - without the AI, only pairs from 0.35 are suggested: 16 of 24 related pairs and none of the
 *   16 unrelated ones (pairs sharing just a word, like "bank holiday" / "savings bank", reach 0.34).
 */
export const CONNECT_THRESHOLDS = {
  candidateFloor: 0.2,
  topK: 5,
  local: 0.35,
  /** Thoughts checked per AI request (the server takes at most 4). */
  aiBatch: 4,
  /** Thoughts checked per pass without the AI. */
  localBatch: 20,
  /** Shared word stems needed by the last-resort word matching. */
  minSharedWords: 2,
} as const;

export const AI_KINDS: ConnectionKind[] = ['same-subject', 'shared-theme', 'different-feelings', 'builds-on'];

export interface FoundLink {
  thoughtId: string;
  otherId: string;
  kind: ConnectionKind;
  subject?: string;
  reason: string;
  /** Similarity of meaning (0–1), used to rank suggestions. */
  score: number;
}

/** One key per unordered pair of thoughts. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** The marker saved on a thought once its text has been checked, with or without the AI. */
export function checkMarker(thought: Thought, withAi: boolean): string {
  const hash = hashText(thought.text);
  return withAi ? hash : `local:${hash}`;
}

/**
 * Whether a thought should be checked for connections now: never checked, edited since,
 * or checked without the AI while the AI can be used again.
 */
export function needsCheck(thought: Thought, aiUsable: boolean): boolean {
  if (thought.connectChecked === checkMarker(thought, true)) return false;
  if (thought.connectChecked === checkMarker(thought, false)) return aiUsable;
  return true;
}

/** The next thoughts to check, newest first: recent thoughts matter most. */
export function nextToCheck(thoughts: Thought[], aiUsable: boolean, limit: number): Thought[] {
  return thoughts
    .filter((t) => needsCheck(t, aiUsable))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Suggestions to drop before checking these thoughts again: they came from older text or
 * from the no-AI fallback. Accepted and dismissed pairs are the person's choices and stay.
 */
export function staleSuggestions(batch: Thought[], connections: Connection[]): Connection[] {
  const rechecked = new Set(batch.filter((t) => t.connectChecked).map((t) => t.id));
  return connections.filter(
    (c) => c.status === 'suggested' && (rechecked.has(c.sourceThoughtId) || rechecked.has(c.targetThoughtId))
  );
}

/** Pairs that must not be suggested again: anything already recorded. */
export function recordedPairs(connections: Connection[]): Set<string> {
  return new Set(connections.map((c) => pairKey(c.sourceThoughtId, c.targetThoughtId)));
}

export interface ConnectCandidate {
  id: string;
  score: number;
}

/** The closest thoughts in meaning, skipping recorded pairs. */
export function findCandidates(
  thoughtId: string,
  vectors: Map<string, number[]>,
  excluded: Set<string>,
  floor: number = CONNECT_THRESHOLDS.candidateFloor,
  topK: number = CONNECT_THRESHOLDS.topK
): ConnectCandidate[] {
  const vector = vectors.get(thoughtId);
  if (!vector) return [];
  const candidates: ConnectCandidate[] = [];
  for (const [id, other] of vectors) {
    if (id === thoughtId || excluded.has(pairKey(thoughtId, id))) continue;
    const score = cosineSimilarity(vector, other);
    if (score >= floor) candidates.push({ id, score });
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, topK);
}

/** Without the AI: only candidates very close in meaning, with a modest reason. */
export function localLinks(thought: Thought, candidates: ConnectCandidate[], thoughts: Thought[]): FoundLink[] {
  return candidates
    .filter((c) => c.score >= CONNECT_THRESHOLDS.local)
    .flatMap((c) => {
      const other = thoughts.find((t) => t.id === c.id);
      if (!other) return [];
      const words = sharedWords(thought.text, other.text);
      return [
        {
          thoughtId: thought.id,
          otherId: other.id,
          kind: 'similar' as const,
          subject: words[0],
          reason: words.length > 0 ? formatConnectionReason(words) : 'These seem to be about something similar.',
          score: c.score,
        },
      ];
    });
}

/** Last resort, for devices that can't run the meaning model: shared words, by stem. */
export function wordLinks(thought: Thought, thoughts: Thought[], excluded: Set<string>): FoundLink[] {
  const links: FoundLink[] = [];
  for (const other of thoughts) {
    if (other.id === thought.id || excluded.has(pairKey(thought.id, other.id))) continue;
    const words = sharedWords(thought.text, other.text);
    if (words.length < CONNECT_THRESHOLDS.minSharedWords) continue;
    links.push({
      thoughtId: thought.id,
      otherId: other.id,
      kind: 'shared-words',
      subject: words[0],
      reason: formatConnectionReason(words),
      score: 0,
    });
  }
  return links;
}

/**
 * Checks the server's (untrusted) answer against what was asked: known pairs only, known
 * kinds, short text, once per pair. The score comes from this device, not the answer.
 */
export function linksFromAi(raw: unknown, asked: Map<string, { thoughtId: string; otherId: string; score: number }>): FoundLink[] {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const links: FoundLink[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const { thoughtId, candidateId, kind, subject, reason } = item as Record<string, unknown>;
    if (typeof thoughtId !== 'string' || typeof candidateId !== 'string') continue;
    const key = pairKey(thoughtId, candidateId);
    const pair = asked.get(key);
    if (!pair || seen.has(key)) continue;
    if (!AI_KINDS.includes(kind as ConnectionKind)) continue;
    if (typeof reason !== 'string' || !reason.trim()) continue;
    seen.add(key);
    links.push({
      thoughtId: pair.thoughtId,
      otherId: pair.otherId,
      kind: kind as ConnectionKind,
      subject: typeof subject === 'string' && subject.trim() ? subject.trim().slice(0, 60) : undefined,
      reason: reason.trim().slice(0, 200),
      score: pair.score,
    });
  }
  return links;
}

// Clear kinds of link come before broad themes; then the closest in meaning.
const KIND_BOOST: Partial<Record<ConnectionKind, number>> = {
  'same-subject': 0.15,
  'different-feelings': 0.15,
  'builds-on': 0.1,
};

/** Suggestions to show, best first. Pairs with a missing thought are left out. */
export function rankSuggestions(connections: Connection[], thoughts: Thought[]): Connection[] {
  const ids = new Set(thoughts.map((t) => t.id));
  const rank = (c: Connection) => (c.score ?? 0) + (c.kind ? KIND_BOOST[c.kind] ?? 0 : 0);
  return connections
    .filter((c) => c.status === 'suggested' && ids.has(c.sourceThoughtId) && ids.has(c.targetThoughtId))
    .sort((a, b) => rank(b) - rank(a) || b.createdAt.localeCompare(a.createdAt));
}
