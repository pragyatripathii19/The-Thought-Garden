import React, { useState } from 'react';
import { ChevronRight, X, Link2, Leaf } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { NavTab, Thought } from '../types';
import { formatRelativeTime } from '../lib/time';
import { SeedToSproutAnimation } from '../components/BotanicalIllustrations';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { FallingLeaves } from '../components/FallingLeaves';
import { getThoughtCategoryMeta } from '../lib/categoryMeta';
import { useOrganizer } from '../context/OrganizerContext';
import { GroupSuggestionCard } from '../components/GroupSuggestionCard';
import { AutoBadge } from '../components/OrganizeToast';
import { CollectionIcon } from '../components/CollectionIcon';
import { ART } from '../lib/art';
import { pickCapturePrompt } from '../lib/capturePrompts';
import { MAX_THOUGHT_LENGTH } from '../lib/defaults';

interface GardenViewProps {
  onNavigateTab?: (tab: NavTab) => void;
  onOpenNewThought?: () => void;
}

// Shared surfaces for the v1 garden look.
const CARD = 'bg-garden-card/85 border border-garden-line rounded-2xl';
const CARD_HOVER = 'hover:bg-garden-card-hover hover:border-[#D6CAA6] transition-colors';
const SECTION_TITLE = 'font-serif text-[26px] leading-tight font-semibold text-garden-ink';
const LINK = 'text-sm font-semibold text-garden-ink-soft hover:text-garden-moss transition-colors';
const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-garden-moss hover:bg-garden-moss-dark text-[#F4EEDB] text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed';
const QUIET_BUTTON = 'text-sm text-garden-ink-soft hover:text-garden-ink transition-colors';

export const GardenView: React.FC<GardenViewProps> = ({ onNavigateTab }) => {
  const {
    thoughts,
    collections,
    connections,
    suggestedConnection,
    rediscoveredThought,
    dismissRediscoveredThought,
    createThought,
    updateThought,
    deleteThought,
    acceptConnection,
    dismissConnection,
    setActiveCollectionId,
    isLoading,
    error,
    userProfile,
  } = useThoughts();

  const { groupSuggestions } = useOrganizer();
  const [input, setInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justPlanted, setJustPlanted] = useState(false);
  // The capture prompt follows why they're here, and moves on after each planted thought.
  const [promptTurn, setPromptTurn] = useState(() => Math.floor(Math.random() * 1000));
  const capturePrompt = pickCapturePrompt(userProfile?.reasons, promptTurn);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  const acceptedConnections = connections
    .filter((c) => c.status === 'accepted')
    .map((c) => {
      const source = thoughts.find((t) => t.id === c.sourceThoughtId);
      const target = thoughts.find((t) => t.id === c.targetThoughtId);
      return { connection: c, source, target };
    })
    .filter((item): item is { connection: typeof item.connection; source: Thought; target: Thought } =>
      Boolean(item.source && item.target)
    );

  // Time-of-day greeting: the sun in the morning and afternoon, the moon in the evening.
  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const isEvening = hour >= 17;

  const handlePlant = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSaving) return;

    try {
      setIsSaving(true);
      await createThought(trimmed);
      setInput('');
      setJustPlanted(true);
      setPromptTurn((n) => n + 1);
      setTimeout(() => {
        setJustPlanted(false);
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePlant();
    }
  };

  const handleCollectionClick = (collectionId: string) => {
    setActiveCollectionId(collectionId);
    if (onNavigateTab) {
      onNavigateTab('collections');
    }
  };

  const firstName = userProfile?.name ? userProfile.name.split(' ')[0] : 'Gardener';

  return (
    <>
      {/* Delicate falling leaves */}
      <FallingLeaves />

      <div className="relative z-10 space-y-10 pb-16">
        {/* Greeting */}
        <section className="pt-4 md:pt-8 space-y-1.5">
          <h2 className="font-serif text-[40px] sm:text-[46px] leading-[1.05] font-semibold tracking-tight text-garden-ink">
            {getGreeting()},{' '}
            {/* The name and the sun/moon wrap together, so the icon never sits alone. */}
            <span className="whitespace-nowrap">
              {firstName}
              <img
                src={isEvening ? ART.moon : ART.sun}
                alt=""
                aria-hidden="true"
                className={`inline-block select-none ml-3 ${isEvening ? 'w-9 sm:w-10 align-[-0.1em]' : 'w-11 sm:w-12 align-[-0.05em]'}`}
              />
            </span>
          </h2>
          <p className="font-serif italic text-xl text-garden-ink-soft">Your thoughts are growing.</p>
        </section>

        {/* Capture */}
        <section className={`${CARD} relative p-5 sm:p-6 focus-within:border-[#BFB38F] focus-within:ring-4 focus-within:ring-garden-pill/60 transition-all`}>
          <img
            src={ART.butterfly}
            alt=""
            aria-hidden="true"
            className="absolute -top-8 -right-3 sm:-top-10 sm:-right-6 w-16 sm:w-24 rotate-12 pointer-events-none select-none"
          />
          <div className="space-y-1">
            <label htmlFor="home-capture-input" className="block font-serif text-[28px] leading-tight font-semibold text-garden-ink">
              Capture a thought
            </label>
            <p className="text-sm text-garden-ink-soft">No need to decide where it belongs. Just write.</p>
          </div>

          <textarea
            id="home-capture-input"
            rows={3}
            maxLength={MAX_THOUGHT_LENGTH}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            placeholder={capturePrompt}
            className="mt-4 w-full px-4 py-3 rounded-xl bg-[#FDFBF3] border border-garden-line-soft text-garden-ink placeholder-garden-ink-faint text-base sm:text-[17px] leading-relaxed resize-none focus:outline-none focus:border-[#CFC39F]"
          />

          {error && (
            <p className="text-sm text-[#8A3B2E] bg-[#F6E2DC] px-3 py-2 rounded-xl border border-[#E9C6BC] mt-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 mt-4">
            <span className="text-xs text-garden-ink-faint hidden sm:inline">
              <kbd className="px-1.5 py-0.5 bg-garden-paper-deep rounded border border-garden-line font-sans text-[11px] text-garden-ink-soft">
                Ctrl + Enter
              </kbd>{' '}
              to plant
            </span>

            <div className="ml-auto flex items-center gap-3">
              {justPlanted && (
                <div
                  className="flex items-center gap-1.5 text-sm font-semibold text-garden-moss animate-fade-in pointer-events-none select-none"
                  aria-live="polite"
                >
                  <SeedToSproutAnimation className="w-5 h-5 text-garden-moss" />
                  <span>Planted</span>
                </div>
              )}
              <button
                type="button"
                onClick={handlePlant}
                disabled={!input.trim() || isSaving || justPlanted}
                className={PRIMARY_BUTTON}
                aria-label="Plant thought"
              >
                <Leaf className="w-4 h-4" />
                <span>Plant thought</span>
              </button>
            </div>
          </div>
        </section>

        {/* A thought for you (rediscovery) */}
        {rediscoveredThought && (
          <section className="space-y-3 animate-fade-in">
            <h3 className={SECTION_TITLE}>A thought for you</h3>
            <div className={`${CARD} ${CARD_HOVER} animate-rediscovery-accent relative flex items-center gap-4 p-4 sm:p-5 border-l-[3px] border-l-garden-moss/40`}>
              <button
                type="button"
                onClick={() => setSelectedThoughtId(rediscoveredThought.id)}
                className="flex-1 min-w-0 text-left space-y-1"
              >
                <p className="font-serif italic text-lg sm:text-xl leading-snug text-garden-ink line-clamp-3 whitespace-pre-wrap">
                  “{rediscoveredThought.text}”
                </p>
                <p className="text-xs text-garden-ink-faint">Planted {formatRelativeTime(rediscoveredThought.createdAt).replace(/^Just now$/, 'just now')}</p>
              </button>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => dismissRediscoveredThought(rediscoveredThought.id)}
                  className="p-1.5 text-garden-ink-faint hover:text-garden-ink rounded-lg"
                  title="Dismiss for now"
                  aria-label="Dismiss for now"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedThoughtId(rediscoveredThought.id)}
                  className="p-1.5 text-garden-ink-soft hover:text-garden-moss rounded-lg"
                  aria-label="Open this thought"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Suggested connection */}
        {suggestedConnection && (
          <section className={`${CARD} p-5 sm:p-6 space-y-4 animate-fade-in`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-garden-pill/70 text-garden-moss flex items-center justify-center shrink-0" aria-hidden="true">
                  <Link2 className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-serif text-2xl leading-tight font-semibold text-garden-ink">This might connect to…</h3>
                  <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-garden-tag text-garden-tag-ink border border-garden-line">
                    {suggestedConnection.reason}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  dismissConnection(suggestedConnection.sourceThought.id, suggestedConnection.targetThought.id)
                }
                className="p-1.5 text-garden-ink-faint hover:text-garden-ink rounded-lg"
                title="Dismiss suggestion"
                aria-label="Dismiss suggestion"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[suggestedConnection.sourceThought, suggestedConnection.targetThought].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedThoughtId(t.id)}
                  className="p-4 rounded-xl bg-[#FDFBF3] border border-garden-line-soft text-left hover:border-[#D6CAA6] transition-colors"
                >
                  <p className="text-sm text-garden-ink line-clamp-3 leading-relaxed">{t.text}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() =>
                  dismissConnection(suggestedConnection.sourceThought.id, suggestedConnection.targetThought.id)
                }
                className={QUIET_BUTTON}
              >
                Dismiss for now
              </button>
              <button
                type="button"
                onClick={() =>
                  acceptConnection(
                    suggestedConnection.sourceThought.id,
                    suggestedConnection.targetThought.id,
                    suggestedConnection.reason
                  )
                }
                className={PRIMARY_BUTTON}
              >
                <Link2 className="w-4 h-4" />
                <span>Connect them</span>
              </button>
            </div>
          </section>
        )}

        {/* Automatic organising: "group these two thoughts?" (on-device rule) */}
        {groupSuggestions.slice(0, 1).map((s) => (
          <GroupSuggestionCard key={s.id} suggestion={s} onOpenThought={setSelectedThoughtId} />
        ))}

        {/* Collections */}
        <section className="space-y-3.5">
          <div className="flex items-baseline justify-between">
            <h3 className={SECTION_TITLE}>Your collections</h3>
            <button type="button" onClick={() => onNavigateTab && onNavigateTab('collections')} className={LINK}>
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {collections.map((col, index) => {
              const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
              // 6 on larger screens, 4 on phones; an odd last card spans the row instead of sitting alone.
              const visibility = index >= 6 ? 'hidden' : index >= 4 ? 'hidden sm:flex' : 'flex';
              const shownOnWide = Math.min(collections.length, 6);
              const span = index === shownOnWide - 1 && shownOnWide % 2 === 1 ? 'sm:col-span-2' : '';
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleCollectionClick(col.id)}
                  className={`${CARD} ${CARD_HOVER} ${visibility} ${span} items-center gap-3.5 p-4 text-left`}
                >
                  <CollectionIcon collection={col} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-xl leading-tight font-semibold text-garden-ink truncate">
                      {col.name}
                      {col.origin === 'auto' && <AutoBadge className="ml-1.5 align-middle" />}
                    </h4>
                    <p className="text-xs text-garden-ink-faint mt-0.5">
                      {count} {count === 1 ? 'thought' : 'thoughts'}
                    </p>
                    {col.description && (
                      <p className="text-xs text-garden-ink-soft mt-1 line-clamp-1 hidden sm:block">{col.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-garden-ink-faint shrink-0" />
                </button>
              );
            })}
          </div>
          {collections.length > 6 && (
            <div className="hidden sm:flex justify-end">
              <button type="button" onClick={() => onNavigateTab && onNavigateTab('collections')} className={LINK}>
                + {collections.length - 6} more collections →
              </button>
            </div>
          )}
          {collections.length > 4 && (
            <div className="flex sm:hidden justify-end">
              <button type="button" onClick={() => onNavigateTab && onNavigateTab('collections')} className={LINK}>
                + {collections.length - 4} more →
              </button>
            </div>
          )}
        </section>

        {/* Recent thoughts */}
        <section className="space-y-3.5">
          <div className="flex items-baseline justify-between">
            <h3 className={SECTION_TITLE}>Recent thoughts</h3>
            <button type="button" onClick={() => onNavigateTab && onNavigateTab('thoughts')} className={LINK}>
              View all
            </button>
          </div>

          {isLoading ? (
            <div className="py-10 text-center font-serif italic text-lg text-garden-ink-faint" role="status">
              Tending the garden…
            </div>
          ) : thoughts.length === 0 ? (
            <div className={`${CARD} flex flex-col items-center text-center px-6 py-10`}>
              <img src={ART.bee} alt="" aria-hidden="true" className="w-24 -rotate-12 mb-4" />
              <p className="font-serif text-2xl font-semibold text-garden-ink">Your garden starts with one thought</p>
              <p className="text-sm text-garden-ink-soft mt-1">Capture any fragment above to begin.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {thoughts.slice(0, 10).map((thought) => {
                const meta = getThoughtCategoryMeta(thought);
                const CategoryIcon = meta.Icon;
                return (
                  <li key={thought.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedThoughtId(thought.id)}
                      className={`${CARD} ${CARD_HOVER} w-full flex items-center gap-3.5 p-3.5 sm:p-4 text-left group`}
                    >
                      <span className="w-10 h-10 rounded-full bg-garden-paper-deep text-garden-ink-soft flex items-center justify-center shrink-0" aria-hidden="true">
                        <CategoryIcon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                      </span>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-[15px] leading-snug text-garden-ink line-clamp-2">{thought.text}</p>
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${meta.badgeBg}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-garden-ink-faint">{formatRelativeTime(thought.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-garden-ink-faint group-hover:text-garden-moss shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Connected thoughts */}
        {acceptedConnections.length > 0 && (
          <section className="space-y-3.5">
            <div className="flex items-baseline justify-between">
              <h3 className={SECTION_TITLE}>Connected thoughts</h3>
              <span className="text-sm text-garden-ink-faint">
                {acceptedConnections.length} connected {acceptedConnections.length === 1 ? 'pair' : 'pairs'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {acceptedConnections.slice(0, 4).map(({ connection: c, source, target }) => (
                <div key={c.id} className={`${CARD} p-4 space-y-2.5`}>
                  <div className="flex items-center gap-1.5 text-xs text-garden-moss font-semibold">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.reason}</span>
                  </div>
                  {[source, target].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedThoughtId(t.id)}
                      className="w-full p-3 rounded-xl bg-[#FDFBF3] border border-garden-line-soft hover:border-[#D6CAA6] text-left text-sm text-garden-ink line-clamp-2 transition-colors"
                    >
                      {t.text}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Thought Detail Modal */}
        <ThoughtDetailModal
          thought={selectedThought}
          isOpen={Boolean(selectedThought)}
          onClose={() => setSelectedThoughtId(null)}
          onUpdate={updateThought}
          onDelete={deleteThought}
          onSelectThought={(t) => setSelectedThoughtId(t.id)}
        />
      </div>
    </>
  );
};
