import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { OrganizeEvent } from '../types';
import { useThoughts } from './StorageContext';
import { useOptionalAuth } from './AuthContext';
import { Embedder, canRunLocalEmbedder } from '../lib/organize/embedder';
import {
  OrganizerActions,
  applyDecision,
  buildClassifyPayload,
  createOrganizeId,
  isStillApplicable,
  prepareClassification,
  undoOrganizeEvent,
} from '../lib/organize/organizer';
import { decideLocally } from '../lib/organize/localRule';
import { validateDecision } from '../lib/organize/validateDecision';
import { fetchSmartOrganizingAvailable, requestClassification } from '../lib/organize/classifierClient';
import { SerialQueue } from '../lib/organize/queue';
import { SmartPause, smartPauseAfter } from '../lib/organize/smartBackoff';
import { describeReason } from '../lib/profileReasons';
import { GroupSuggestion, OrganizeDecision } from '../lib/organize/types';
import {
  OrganizerSettings,
  loadGroupSuggestions,
  loadOrganizerSettings,
  saveGroupSuggestions,
  saveOrganizerSettings,
} from '../lib/organize/settings';

export type EmbedderStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

export interface OrganizeNotice {
  id: string;
  message: string;
  events: OrganizeEvent[];
}

interface OrganizerContextValue {
  settings: OrganizerSettings;
  updateSettings: (patch: Partial<OrganizerSettings>) => void;
  /** Whether the server has an LLM configured. */
  smartAvailable: boolean;
  /** Set while Smart organising is paused after a failure; on-device organising is used meanwhile. */
  smartPause: SmartPause | null;
  embedderStatus: EmbedderStatus;
  isWorking: boolean;
  events: OrganizeEvent[];
  notice: OrganizeNotice | null;
  dismissNotice: () => void;
  undoEvents: (eventIds: string[]) => Promise<void>;
  groupSuggestions: GroupSuggestion[];
  acceptGroupSuggestion: (id: string, name: string, description: string) => Promise<void>;
  dismissGroupSuggestion: (id: string) => void;
  /** Queues existing ungrouped thoughts for organising. Returns how many were queued. */
  organizeExisting: () => Promise<number>;
}

const OrganizerContext = createContext<OrganizerContextValue | undefined>(undefined);

export interface OrganizerProviderProps {
  children: React.ReactNode;
  /** Injected in tests; defaults to the in-browser Transformers.js embedder. */
  embedder?: Embedder;
}

export const OrganizerProvider: React.FC<OrganizerProviderProps> = ({ children, embedder: injectedEmbedder }) => {
  const {
    thoughts,
    collections,
    userProfile,
    isLoading,
    createCollection,
    updateThought,
    deleteCollection,
    embeddingRepository,
    organizeEventRepository,
  } = useThoughts();

  const auth = useOptionalAuth();
  const [localSettings, setLocalSettings] = useState<OrganizerSettings>(loadOrganizerSettings);
  // Signed-in users: the account decides Smart organising, so it's the same on every device.
  const accountSmart = auth?.user?.smartOrganizing;
  const settings = useMemo<OrganizerSettings>(
    () => (accountSmart === undefined ? localSettings : { ...localSettings, smartOrganizing: accountSmart }),
    [localSettings, accountSmart]
  );
  const [smartPause, setSmartPause] = useState<SmartPause | null>(null);
  const [smartAvailable, setSmartAvailable] = useState(false);
  const [embedderStatus, setEmbedderStatus] = useState<EmbedderStatus>(() =>
    injectedEmbedder || canRunLocalEmbedder() ? 'idle' : 'unsupported'
  );
  const [isWorking, setIsWorking] = useState(false);
  const [events, setEvents] = useState<OrganizeEvent[]>([]);
  const [notice, setNotice] = useState<OrganizeNotice | null>(null);
  const [groupSuggestions, setGroupSuggestions] = useState<GroupSuggestion[]>(() =>
    loadGroupSuggestions<GroupSuggestion>()
  );
  const [sweepTick, setSweepTick] = useState(0);

  // Refs give the async queue the latest state without re-creating callbacks.
  const thoughtsRef = useRef(thoughts);
  thoughtsRef.current = thoughts;
  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const smartAvailableRef = useRef(smartAvailable);
  smartAvailableRef.current = smartAvailable;
  const embedderStatusRef = useRef(embedderStatus);
  embedderStatusRef.current = embedderStatus;
  const signedInRef = useRef(Boolean(userProfile));
  signedInRef.current = Boolean(userProfile);
  // Why they're here, as readable labels; sent with Smart organising requests to name collections well.
  const userFocusRef = useRef<string[]>([]);
  userFocusRef.current = (userProfile?.reasons || []).map((r) => describeReason(r).label);
  const smartPauseRef = useRef<SmartPause | null>(null);
  const smartErrorsRef = useRef(0);
  const actionsRef = useRef<OrganizerActions>({ createCollection, updateThought, deleteCollection });
  actionsRef.current = { createCollection, updateThought, deleteCollection };

  const queueRef = useRef(new SerialQueue());
  const embedderRef = useRef<Embedder | null>(injectedEmbedder || null);
  const labelCacheRef = useRef(new Map<string, { hash: string; vector: number[] }>());

  useEffect(() => {
    fetchSmartOrganizingAvailable().then(setSmartAvailable);
  }, []);

  useEffect(() => {
    organizeEventRepository
      .getAll()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [organizeEventRepository]);

  useEffect(() => {
    saveGroupSuggestions(groupSuggestions);
  }, [groupSuggestions]);

  // Drop suggestions whose thoughts were deleted or have since been grouped.
  useEffect(() => {
    if (isLoading) return;
    setGroupSuggestions((prev) => {
      const next = prev.filter((s) =>
        [s.thoughtId, s.partnerThoughtId].every((id) => {
          const t = thoughts.find((x) => x.id === id);
          return t && t.collectionIds.length === 0 && !t.organizeLocked;
        })
      );
      return next.length === prev.length ? prev : next;
    });
  }, [thoughts, isLoading]);

  // Resume Smart organising when a pause runs out.
  useEffect(() => {
    if (!smartPause) return;
    const clear = () => {
      smartPauseRef.current = null;
      setSmartPause(null);
    };
    const ms = smartPause.until - Date.now();
    if (ms <= 0) {
      clear();
      return;
    }
    const timer = window.setTimeout(clear, ms);
    return () => window.clearTimeout(timer);
  }, [smartPause]);

  const hasAccount = Boolean(auth?.user);
  const updateProfile = auth?.updateProfile;
  const updateSettings = useCallback(
    (patch: Partial<OrganizerSettings>) => {
      const { smartOrganizing, ...rest } = patch;
      const smartOnAccount = smartOrganizing !== undefined && hasAccount && updateProfile;
      if (smartOnAccount) {
        updateProfile({ smartOrganizing }).catch((err) =>
          console.warn('Could not save the Smart organising setting:', err instanceof Error ? err.message : err)
        );
      }
      if (smartOrganizing) {
        // Turning it on is a fresh start: try the AI again straight away.
        smartErrorsRef.current = 0;
        smartPauseRef.current = null;
        setSmartPause(null);
      }
      setLocalSettings((prev) => {
        const next = { ...prev, ...rest };
        if (smartOrganizing !== undefined && !smartOnAccount) next.smartOrganizing = smartOrganizing;
        if (smartOrganizing && !prev.smartConsentAt) next.smartConsentAt = new Date().toISOString();
        saveOrganizerSettings(next);
        return next;
      });
    },
    [hasAccount, updateProfile]
  );

  const getEmbedder = useCallback(async (): Promise<Embedder> => {
    if (!embedderRef.current) {
      const { TransformersEmbedder } = await import('../lib/organize/transformersEmbedder');
      embedderRef.current = new TransformersEmbedder();
    }
    return embedderRef.current;
  }, []);

  const recordEvents = useCallback(
    async (newEvents: OrganizeEvent[], message: string) => {
      if (newEvents.length === 0) return;
      for (const e of newEvents) await organizeEventRepository.add(e);
      setEvents((prev) => [...newEvents, ...prev]);
      setNotice({ id: createOrganizeId('notice'), message, events: newEvents });
    },
    [organizeEventRepository]
  );

  const describe = (decision: OrganizeDecision, newEvents: OrganizeEvent[]): string => {
    if (decision.action === 'create') {
      return `Grouped with a related thought in a new collection, “${newEvents[0]?.collectionName}”.`;
    }
    const names = newEvents.map((e) => `“${e.collectionName}”`).join(' and ');
    return `Added to ${names}.`;
  };

  const processThought = useCallback(
    async (thoughtId: string) => {
      const actions = actionsRef.current;
      const thought = thoughtsRef.current.find((t) => t.id === thoughtId);
      if (!thought || thought.classifyState !== 'pending') return;

      if (thought.organizeLocked || thought.collectionIds.length > 0) {
        await actions.updateThought(thoughtId, { classifyState: 'done', classifiedAt: new Date().toISOString() });
        return;
      }
      if (!settingsRef.current.autoOrganize || embedderStatusRef.current === 'unsupported') {
        await actions.updateThought(thoughtId, { classifyState: 'skipped' });
        return;
      }

      setIsWorking(true);
      try {
        let prepared: Awaited<ReturnType<typeof prepareClassification>>;
        try {
          if (embedderStatusRef.current !== 'ready') setEmbedderStatus('loading');
          const embedder = await getEmbedder();
          prepared = await prepareClassification({
            thoughtId,
            thoughts: thoughtsRef.current,
            collections: collectionsRef.current,
            embedder,
            embeddingRepo: embeddingRepository,
            labelCache: labelCacheRef.current,
          });
          setEmbedderStatus('ready');
        } catch (err) {
          console.warn('Local embedding unavailable:', err instanceof Error ? err.message : err);
          setEmbedderStatus('error');
          await actions.updateThought(thoughtId, { classifyState: 'failed' });
          return;
        }
        if (!prepared) return;

        const localInput = {
          thought: prepared.thought,
          vector: prepared.vector,
          candidates: prepared.candidates,
          thoughts: thoughtsRef.current,
          collections: collectionsRef.current,
          thoughtVectors: prepared.thoughtVectors,
          collectionVectors: prepared.collectionVectors,
        };

        let decision: OrganizeDecision;
        const pause = smartPauseRef.current;
        const useSmart =
          settingsRef.current.smartOrganizing &&
          smartAvailableRef.current &&
          signedInRef.current &&
          !(pause && Date.now() < pause.until) &&
          (typeof navigator === 'undefined' || navigator.onLine);

        if (prepared.candidates.length === 0) {
          // Case D, decided locally: nothing similar exists, so nothing is sent anywhere.
          decision = { action: 'none', reason: 'Nothing similar yet.', source: 'local' };
        } else if (useSmart) {
          try {
            const raw = await requestClassification({
              ...buildClassifyPayload(prepared, thoughtsRef.current, collectionsRef.current),
              userFocus: userFocusRef.current,
            });
            smartErrorsRef.current = 0;
            const validated = validateDecision(raw, {
              thought: thoughtsRef.current.find((t) => t.id === thoughtId) || prepared.thought,
              candidateThoughtIds: new Set(
                prepared.candidates.filter((c) => c.kind === 'thought').map((c) => c.id)
              ),
              thoughts: thoughtsRef.current,
              collections: collectionsRef.current,
            });
            // An unusable AI answer falls back to the on-device rule; a deliberate "none" is respected.
            decision = validated.action === 'none' && validated.rejected ? decideLocally(localInput) : validated;
          } catch (err) {
            // Rate limits, timeouts, network and server errors: organise on-device and pause the AI for a while.
            smartErrorsRef.current += 1;
            const nextPause = smartPauseAfter(err, smartErrorsRef.current);
            if (nextPause) {
              smartPauseRef.current = nextPause; // seen by the next queued thought before React re-renders
              setSmartPause(nextPause);
            }
            console.warn('Smart organising unavailable, using on-device rule:', err instanceof Error ? err.message : err);
            decision = decideLocally(localInput);
          }
        } else {
          decision = decideLocally(localInput);
        }

        // The user may have edited, moved or deleted the thought while we worked.
        if (!isStillApplicable(thoughtId, prepared.textHash, thoughtsRef.current)) {
          const current = thoughtsRef.current.find((t) => t.id === thoughtId);
          if (current?.organizeLocked) {
            await actions.updateThought(thoughtId, { classifyState: 'done', classifiedAt: new Date().toISOString() });
          }
          return; // Text changed: it stays pending and is picked up again.
        }

        if (decision.action === 'suggest-group') {
          const { partnerThoughtId, name, description, reason } = decision;
          setGroupSuggestions((prev) =>
            prev.some((s) => [s.thoughtId, s.partnerThoughtId].includes(thoughtId) && [s.thoughtId, s.partnerThoughtId].includes(partnerThoughtId))
              ? prev
              : [
                  {
                    id: createOrganizeId('sugg'),
                    thoughtId,
                    partnerThoughtId,
                    name,
                    description,
                    reason,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]
          );
        } else if (decision.action === 'assign' || decision.action === 'create') {
          if (decision.action === 'create') {
            const partnerId = decision.newCollection.partnerThoughtId;
            const partner = thoughtsRef.current.find((t) => t.id === partnerId);
            if (!partner || partner.organizeLocked || partner.collectionIds.length > 0) {
              decision = { action: 'none', reason: 'Partner thought changed.', source: decision.source };
            }
          }
          if (decision.action === 'assign' || decision.action === 'create') {
            const newEvents = await applyDecision(
              thoughtId,
              decision,
              thoughtsRef.current,
              collectionsRef.current,
              actions
            );
            await recordEvents(newEvents, describe(decision, newEvents));
          }
        }

        await actions.updateThought(thoughtId, { classifyState: 'done', classifiedAt: new Date().toISOString() });
      } finally {
        setIsWorking(false);
      }
    },
    [embeddingRepository, getEmbedder, recordEvents]
  );

  // Sweep: queue every pending thought. Re-runs when thoughts change or a task finishes.
  useEffect(() => {
    if (isLoading) return;
    const queue = queueRef.current;
    for (const t of thoughts) {
      if (t.classifyState === 'pending' && !queue.has(t.id)) {
        queue.enqueue(t.id, () => processThought(t.id)).then(() => setSweepTick((n) => n + 1));
      }
    }
  }, [thoughts, isLoading, processThought, sweepTick]);

  const undoEvents = useCallback(
    async (eventIds: string[]) => {
      const now = new Date().toISOString();
      for (const id of eventIds) {
        const event = events.find((e) => e.id === id);
        if (!event || event.undoneAt) continue;
        await undoOrganizeEvent(event, thoughtsRef.current, collectionsRef.current, actionsRef.current);
        await organizeEventRepository.update(id, { undoneAt: now });
      }
      setEvents((prev) => prev.map((e) => (eventIds.includes(e.id) && !e.undoneAt ? { ...e, undoneAt: now } : e)));
      setNotice((prev) => (prev && prev.events.some((e) => eventIds.includes(e.id)) ? null : prev));
    },
    [events, organizeEventRepository]
  );

  const acceptGroupSuggestion = useCallback(
    async (id: string, name: string, description: string) => {
      const suggestion = groupSuggestions.find((s) => s.id === id);
      if (!suggestion) return;
      setGroupSuggestions((prev) => prev.filter((s) => s.id !== id));
      const decision: OrganizeDecision = {
        action: 'create',
        newCollection: {
          name: name.trim() || suggestion.name,
          description: description.trim(),
          partnerThoughtId: suggestion.partnerThoughtId,
        },
        reason: suggestion.reason,
        source: 'user-accepted',
      };
      const newEvents = await applyDecision(
        suggestion.thoughtId,
        decision,
        thoughtsRef.current,
        collectionsRef.current,
        actionsRef.current
      );
      await recordEvents(newEvents, describe(decision, newEvents));
    },
    [groupSuggestions, recordEvents]
  );

  const dismissGroupSuggestion = useCallback((id: string) => {
    setGroupSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const organizeExisting = useCallback(async () => {
    const eligible = thoughtsRef.current.filter(
      (t) => t.collectionIds.length === 0 && !t.organizeLocked && t.classifyState !== 'pending'
    );
    // Oldest first, so groups form in the order thoughts were planted.
    const ordered = [...eligible].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const t of ordered) {
      await actionsRef.current.updateThought(t.id, { classifyState: 'pending' });
    }
    return ordered.length;
  }, []);

  const value = useMemo<OrganizerContextValue>(
    () => ({
      settings,
      updateSettings,
      smartAvailable,
      smartPause,
      embedderStatus,
      isWorking,
      events,
      notice,
      dismissNotice: () => setNotice(null),
      undoEvents,
      groupSuggestions,
      acceptGroupSuggestion,
      dismissGroupSuggestion,
      organizeExisting,
    }),
    [
      settings,
      updateSettings,
      smartAvailable,
      smartPause,
      embedderStatus,
      isWorking,
      events,
      notice,
      undoEvents,
      groupSuggestions,
      acceptGroupSuggestion,
      dismissGroupSuggestion,
      organizeExisting,
    ]
  );

  return <OrganizerContext.Provider value={value}>{children}</OrganizerContext.Provider>;
};

export function useOrganizer(): OrganizerContextValue {
  const context = useContext(OrganizerContext);
  if (!context) {
    throw new Error('useOrganizer must be used within an OrganizerProvider');
  }
  return context;
}
