import { useCallback, useEffect, useRef, useState } from 'react';
import { useThoughts } from './StorageContext';
import { Embedder } from '../lib/organize/embedder';
import { syncEmbeddings } from '../lib/organize/organizer';
import { smartPauseAfter } from '../lib/organize/smartBackoff';
import { requestConnections, ConnectRequestThought } from '../lib/connect/client';
import {
  CONNECT_THRESHOLDS,
  FoundLink,
  checkMarker,
  findCandidates,
  linksFromAi,
  localLinks,
  nextToCheck,
  pairKey,
  recordedPairs,
  staleSuggestions,
  wordLinks,
} from '../lib/connect/finder';

/** At most one AI request this often: the free AI tier allows only a few per minute. */
const MIN_AI_GAP_MS = 20 * 1000;

export interface ConnectionFinderOptions {
  /** Smart organising is on, configured and the person is signed in. */
  aiUsable: boolean;
  /** Organising goes first; both use the same embedding model. */
  organizingBusy: boolean;
  /** This device can't run the meaning model: fall back to shared words. */
  embedderUnsupported: boolean;
  getEmbedder: () => Promise<Embedder>;
}

/**
 * Looks for connections in the background, a few thoughts at a time, newest first: new and
 * edited thoughts, and once for every existing thought. Likely pairs are found on this device;
 * with Smart organising the AI decides which are really connected, how, and why.
 */
export function useConnectionFinder({ aiUsable, organizingBusy, embedderUnsupported, getEmbedder }: ConnectionFinderOptions) {
  const {
    thoughts,
    connections,
    isLoading,
    updateThought,
    addConnectionSuggestions,
    removeConnections,
    embeddingRepository,
  } = useThoughts();

  const thoughtsRef = useRef(thoughts);
  thoughtsRef.current = thoughts;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const aiUsableRef = useRef(aiUsable);
  aiUsableRef.current = aiUsable;

  const runningRef = useRef(false);
  // Something changed while a pass was running: look again when it ends.
  const missedChangeRef = useRef(false);
  const lastAiCallRef = useRef(0);
  const aiPausedUntilRef = useRef(0);
  const aiErrorsRef = useRef(0);
  const [tick, setTick] = useState(0);
  const wakeTimerRef = useRef<number | null>(null);

  const wakeLater = useCallback((ms: number) => {
    if (wakeTimerRef.current !== null) window.clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current = window.setTimeout(() => {
      wakeTimerRef.current = null;
      setTick((n) => n + 1);
    }, Math.max(0, ms));
  }, []);

  useEffect(
    () => () => {
      if (wakeTimerRef.current !== null) window.clearTimeout(wakeTimerRef.current);
    },
    []
  );

  /** One batch. Returns true when it checked something, so the next batch can follow. */
  const runPass = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    let withAi = aiUsableRef.current;
    if (withAi) {
      // The AI's suggestions are much better and none of this is urgent, so wait for it.
      const waitFor = Math.max(aiPausedUntilRef.current, lastAiCallRef.current + MIN_AI_GAP_MS) - now;
      const offline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (waitFor > 0 || offline) {
        if (nextToCheck(thoughtsRef.current, true, 1).length > 0) wakeLater(offline ? 30 * 1000 : waitFor);
        return false;
      }
    }

    const batch = nextToCheck(
      thoughtsRef.current,
      withAi,
      withAi ? CONNECT_THRESHOLDS.aiBatch : CONNECT_THRESHOLDS.localBatch
    );
    if (batch.length === 0) return false;

    // Suggestions from older text (or from the fallback) make way for fresh ones.
    const stale = staleSuggestions(batch, connectionsRef.current);
    if (stale.length > 0) await removeConnections(stale.map((c) => c.id));
    const staleIds = new Set(stale.map((c) => c.id));
    const excluded = recordedPairs(connectionsRef.current.filter((c) => !staleIds.has(c.id)));

    let links: FoundLink[] = [];
    let vectors: Map<string, number[]> | null = null;
    if (!embedderUnsupported) {
      try {
        vectors = await syncEmbeddings(await getEmbedder(), embeddingRepository, thoughtsRef.current);
      } catch (err) {
        console.warn('Connections: meaning model unavailable, matching words instead:', err instanceof Error ? err.message : err);
      }
    }

    if (!vectors) {
      withAi = false;
      links = batch.flatMap((t) => wordLinks(t, thoughtsRef.current, excluded));
    } else if (withAi) {
      const textOf = new Map(thoughtsRef.current.map((t) => [t.id, t.text]));
      const asked = new Map<string, { thoughtId: string; otherId: string; score: number }>();
      const request: ConnectRequestThought[] = [];
      for (const t of batch) {
        const fresh = findCandidates(t.id, vectors, excluded).filter((c) => !asked.has(pairKey(t.id, c.id)));
        for (const c of fresh) asked.set(pairKey(t.id, c.id), { thoughtId: t.id, otherId: c.id, score: c.score });
        if (fresh.length > 0) {
          request.push({ id: t.id, text: t.text, candidates: fresh.map((c) => ({ id: c.id, text: textOf.get(c.id) || '' })) });
        }
      }
      if (request.length > 0) {
        lastAiCallRef.current = Date.now();
        try {
          links = linksFromAi(await requestConnections(request), asked);
          aiErrorsRef.current = 0;
        } catch (err) {
          aiErrorsRef.current += 1;
          const pause = smartPauseAfter(err, aiErrorsRef.current);
          if (pause && pause.reason !== 'unavailable') {
            // Busy or failing: try these thoughts again later.
            aiPausedUntilRef.current = pause.until;
            console.warn('Connections: AI unavailable for now, will retry:', err instanceof Error ? err.message : err);
            wakeLater(pause.until - Date.now());
            return false;
          }
          // Turned off on another device or not configured: use this device's judgement instead.
          if (pause) aiPausedUntilRef.current = pause.until;
          withAi = false;
          links = batch.flatMap((t) => localLinks(t, findCandidates(t.id, vectors!, excluded), thoughtsRef.current));
        }
      }
    } else {
      links = batch.flatMap((t) => localLinks(t, findCandidates(t.id, vectors!, excluded), thoughtsRef.current));
    }

    // The person may have edited or deleted thoughts meanwhile: those are checked again later.
    const current = new Map(thoughtsRef.current.map((t) => [t.id, t]));
    const unchanged = batch.filter((t) => current.get(t.id)?.text === t.text);
    const unchangedIds = new Set(unchanged.map((t) => t.id));
    await addConnectionSuggestions(links.filter((l) => unchangedIds.has(l.thoughtId) && current.has(l.otherId)));
    for (const t of unchanged) await updateThought(t.id, { connectChecked: checkMarker(t, withAi) });
    return true;
  }, [embedderUnsupported, getEmbedder, embeddingRepository, removeConnections, addConnectionSuggestions, updateThought, wakeLater]);

  useEffect(() => {
    if (isLoading || organizingBusy) return;
    if (runningRef.current) {
      missedChangeRef.current = true;
      return;
    }
    runningRef.current = true;
    missedChangeRef.current = false;
    runPass()
      .then((didWork) => {
        if (didWork || missedChangeRef.current) setTick((n) => n + 1);
      })
      .catch((err) => {
        console.warn('Connections: a pass failed:', err instanceof Error ? err.message : err);
        wakeLater(60 * 1000);
      })
      .finally(() => {
        runningRef.current = false;
      });
  }, [thoughts, connections, isLoading, organizingBusy, aiUsable, tick, runPass, wakeLater]);
}
