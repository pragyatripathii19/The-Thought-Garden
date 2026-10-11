import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Sparkles,
  X,
  History,
  Link2,
  Search,
  PenTool,
  CheckSquare,
  Sprout,
} from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { NavTab, Thought, Collection } from '../types';
import { formatRelativeTime } from '../lib/time';
import { WateringCanHeroArt, RollingHillsFooterArt, LeafLogoIcon, SeedToSproutAnimation } from '../components/BotanicalIllustrations';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { FallingLeaves } from '../components/FallingLeaves';
import { getThoughtCategoryMeta } from '../lib/categoryMeta';
import { useOrganizer } from '../context/OrganizerContext';
import { GroupSuggestionCard } from '../components/GroupSuggestionCard';
import { AutoBadge } from '../components/OrganizeToast';

interface GardenViewProps {
  onNavigateTab?: (tab: NavTab) => void;
  onOpenNewThought?: () => void;
}

export const GardenView: React.FC<GardenViewProps> = ({
  onNavigateTab,
}) => {
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

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handlePlant = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSaving) return;

    try {
      setIsSaving(true);
      await createThought(trimmed);
      setInput('');
      setJustPlanted(true);
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

  // Collection card styling variants
  const getCollectionCardStyles = (collection: Collection) => {
    if (collection.id === 'col-startup-ideas' || collection.colorVariant === 'green') {
      return {
        cardBg: 'bg-[#edf4ee] border-[#d6e5d8] hover:border-[#b8d4bd]',
        iconBg: 'bg-[#dcebdd] text-[#34593e]',
        arrowColor: 'text-[#34593e]',
        Icon: Sprout,
      };
    }
    if (collection.id === 'col-writing' || collection.colorVariant === 'rose') {
      return {
        cardBg: 'bg-[#fdf2f2] border-[#f5d9db] hover:border-[#eec2c5]',
        iconBg: 'bg-[#fae2e3] text-[#8c3b42]',
        arrowColor: 'text-[#8c3b42]',
        Icon: PenTool,
      };
    }
    if (collection.id === 'col-things-to-research' || collection.colorVariant === 'purple') {
      return {
        cardBg: 'bg-[#f4f3fa] border-[#e1def4] hover:border-[#cecaec]',
        iconBg: 'bg-[#e7e4f6] text-[#4f4886]',
        arrowColor: 'text-[#4f4886]',
        Icon: Search,
      };
    }
    return {
      cardBg: 'bg-[#fdf6ee] border-[#f5e3ce] hover:border-[#ebd0b4]',
      iconBg: 'bg-[#fae8d4] text-[#855320]',
      arrowColor: 'text-[#855320]',
      Icon: CheckSquare,
    };
  };

  return (
    <>
      {/* Delicate falling sage-green leaves ambient background */}
      <FallingLeaves />

      <div className="relative z-10 space-y-8 pb-16">
        {/* Top Greeting Section with Botanical Illustration */}
        <section className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#3d5a45]">
                <LeafLogoIcon className="w-5 h-5" />
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#222c23]">
                {getGreeting()}, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Gardener'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#738274]">
              Your thoughts are growing.
            </p>
          </div>

          {/* Botanical Illustration (Desktop & Tablet) */}
          <div className="hidden sm:block shrink-0 -my-3 -mr-1">
            <WateringCanHeroArt className="w-32 h-24 lg:w-36 lg:h-28" />
          </div>
        </section>

        {/* Prominent Quick Capture Card */}
        <section className="bg-white border border-[#e2dcd0] rounded-2xl p-4 sm:p-5 shadow-xs focus-within:border-[#7a9d83] focus-within:ring-2 focus-within:ring-[#e4ede6] transition-all">
          <div className="space-y-2">
            <label
              htmlFor="home-capture-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[#69786a]"
            >
              What's on your mind?
            </label>
            <textarea
              id="home-capture-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder="e.g. an idea, a feeling to express, or perhaps a whim?"
              className="w-full bg-transparent text-[#233126] placeholder-[#9ca89d] text-base sm:text-lg resize-none focus:outline-none leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 mt-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#f4f0e6] mt-2">
            <span className="text-[11px] text-[#97a599] hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-[#f5f2e9] rounded border border-[#e4ded2] font-mono text-[10px] text-[#6b786c]">Ctrl + Enter</kbd> to plant
            </span>

            <div className="ml-auto flex items-center gap-3">
              {justPlanted && (
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#344e3b] animate-fade-in pointer-events-none select-none"
                  aria-live="polite"
                >
                  <SeedToSproutAnimation className="w-5 h-5 text-[#344e3b]" />
                  <span>Planted</span>
                </div>
              )}
              <button
                type="button"
                onClick={handlePlant}
                disabled={!input.trim() || isSaving || justPlanted}
                className="w-10 h-10 rounded-full bg-[#344e3b] hover:bg-[#2b4131] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-transform active:scale-95 shadow-xs"
                title="Plant thought"
                aria-label="Plant thought"
              >
                <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </section>

      {/* Suggested Connection Card (Piece 5) */}
      {suggestedConnection && (
        <section className="bg-[#f3f7f4] border border-[#d6e5d8] rounded-2xl p-5 shadow-xs animate-fade-in space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#3d5a45] text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="font-serif text-base font-semibold text-[#233126]">
                  This might connect to…
                </h3>
                <p className="text-xs text-[#526e57] font-medium">
                  {suggestedConnection.reason}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                dismissConnection(
                  suggestedConnection.sourceThought.id,
                  suggestedConnection.targetThought.id
                )
              }
              className="p-1 text-[#869688] hover:text-[#233126] rounded-lg"
              title="Dismiss suggestion"
              aria-label="Dismiss suggestion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedThoughtId(suggestedConnection.sourceThought.id)}
              className="p-3.5 bg-white rounded-xl border border-[#dbe7dc] cursor-pointer shadow-xs hover:border-[#a8cca0] transition-colors"
            >
              <p className="text-[#233126] text-xs sm:text-sm line-clamp-3 leading-relaxed">
                {suggestedConnection.sourceThought.text}
              </p>
            </div>

            <div
              onClick={() => setSelectedThoughtId(suggestedConnection.targetThought.id)}
              className="p-3.5 bg-white rounded-xl border border-[#dbe7dc] cursor-pointer shadow-xs hover:border-[#a8cca0] transition-colors"
            >
              <p className="text-[#233126] text-xs sm:text-sm line-clamp-3 leading-relaxed">
                {suggestedConnection.targetThought.text}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                dismissConnection(
                  suggestedConnection.sourceThought.id,
                  suggestedConnection.targetThought.id
                )
              }
              className="text-xs text-[#6e7d70] hover:text-[#233126]"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3d5a45] hover:bg-[#344e3b] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Confirm Connection</span>
            </button>
          </div>
        </section>
      )}

      {/* Automatic organising: "group these two thoughts?" (on-device rule) */}
      {groupSuggestions.slice(0, 1).map((s) => (
        <GroupSuggestionCard key={s.id} suggestion={s} onOpenThought={setSelectedThoughtId} />
      ))}

      {/* Gentle Rediscovery Card (Piece 6) */}
      {rediscoveredThought && (
        <section className="bg-[#fbfaf6] border border-[#e4ded0] rounded-2xl p-5 shadow-xs animate-fade-in animate-rediscovery-accent space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#e8e2d4] text-[#556958] flex items-center justify-center">
                <History className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base font-semibold text-[#233126]">
                    A thought to revisit
                  </h3>
                  <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#edf4ee] text-[#34593e] border border-[#d2e2d5]">
                    Resurfaced
                  </span>
                </div>
                <p className="text-xs text-[#788779]">
                  Planted {formatRelativeTime(rediscoveredThought.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissRediscoveredThought(rediscoveredThought.id)}
              className="p-1 text-[#869688] hover:text-[#233126] rounded-lg"
              title="Dismiss for now"
              aria-label="Dismiss for now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            onClick={() => setSelectedThoughtId(rediscoveredThought.id)}
            className="p-3.5 bg-white rounded-xl border border-[#e4ded0] cursor-pointer shadow-xs hover:border-[#b8caa0] transition-colors"
          >
            <p className="text-[#233126] text-xs sm:text-sm line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {rediscoveredThought.text}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => dismissRediscoveredThought(rediscoveredThought.id)}
              className="text-xs text-[#6e7d70] hover:text-[#233126]"
            >
              Dismiss for now
            </button>
            <button
              type="button"
              onClick={() => setSelectedThoughtId(rediscoveredThought.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3d5a45] hover:bg-[#344f3b] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Inspect Thought</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* Your Collections Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-lg font-semibold text-[#233126]">
            Your Collections
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('collections')}
            className="text-xs font-medium text-[#6e7d70] hover:text-[#233126] transition-colors"
          >
            View all
          </button>
        </div>

        {/* Desktop & Tablet: Up to 6 Pastel Collection Cards Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {collections.slice(0, 6).map((col) => {
            const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
            const styles = getCollectionCardStyles(col);
            const Icon = styles.Icon;

            return (
              <div
                key={col.id}
                onClick={() => handleCollectionClick(col.id)}
                className={`p-4 rounded-2xl border ${styles.cardBg} shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[160px]`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-base font-semibold text-[#233126] leading-snug">
                    {col.name}
                    {col.origin === 'auto' && <AutoBadge className="ml-1.5 align-middle" />}
                  </h4>
                  <div className="text-[11px] text-[#718273] font-medium mt-0.5">
                    {count} {count === 1 ? 'thought' : 'thoughts'}
                  </div>
                  {col.description && (
                    <p className="text-xs text-[#5d6d60] mt-1.5 line-clamp-2 leading-relaxed">
                      {col.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-start">
                  <span className={`${styles.arrowColor}`}>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {collections.length > 6 && (
          <div className="hidden sm:flex justify-end">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('collections')}
              className="text-xs font-medium text-[#6e7d70] hover:text-[#233126] transition-colors"
            >
              + {collections.length - 6} more collections →
            </button>
          </div>
        )}

        {/* Mobile: Compact Rounded List Rows — show 4 */}
        <div className="sm:hidden space-y-2">
          {collections.slice(0, 4).map((col) => {
            const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
            const styles = getCollectionCardStyles(col);
            const Icon = styles.Icon;

            return (
              <div
                key={col.id}
                onClick={() => handleCollectionClick(col.id)}
                className="bg-white border border-[#e4ded0] hover:border-[#b8caa0] p-3 rounded-2xl flex items-center justify-between cursor-pointer shadow-xs active:bg-[#f6f4ed] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-[#233126] leading-tight">
                      {col.name}
                      {col.origin === 'auto' && <AutoBadge className="ml-1.5 align-middle" />}
                    </h4>
                    <span className="text-[11px] text-[#7d8c7f]">
                      {count} thoughts
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#a3b0a4]" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Thoughts Section */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-lg font-semibold text-[#233126]">
            Recent Thoughts
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('thoughts')}
            className="text-xs font-medium text-[#6e7d70] hover:text-[#233126] transition-colors"
          >
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#8f9d90]">
            Tending the garden...
          </div>
        ) : thoughts.length === 0 ? (
          <div className="py-12 text-center bg-white border border-dashed border-[#e4ded0] rounded-2xl p-6">
            <Sprout className="w-8 h-8 mx-auto text-[#628469] mb-2 opacity-80" />
            <p className="font-serif text-base font-semibold text-[#253227]">
              Your garden starts with one thought
            </p>
            <p className="text-xs text-[#718273] mt-1">
              Capture any fragment above to begin your personal garden.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#e2dcd0] rounded-2xl divide-y divide-[#f2ede3] shadow-xs overflow-hidden">
            {thoughts.slice(0, 10).map((thought) => {
              const meta = getThoughtCategoryMeta(thought);
              const CategoryIcon = meta.Icon;

              return (
                <div
                  key={thought.id}
                  onClick={() => setSelectedThoughtId(thought.id)}
                  className="p-3.5 sm:p-4 hover:bg-[#faf8f4] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${meta.iconBg} flex items-center justify-center shrink-0`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm text-[#233126] group-hover:text-[#18231a] truncate font-normal">
                      {thought.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-[#869688]">
                      {formatRelativeTime(thought.createdAt)}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.badgeBg}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Connected Thoughts Section */}
      {acceptedConnections.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#edf5ee] text-[#34593e] flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5" />
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#233126]">
                Connected Thoughts
              </h3>
            </div>
            <span className="text-xs text-[#718273]">
              {acceptedConnections.length} connected {acceptedConnections.length === 1 ? 'pair' : 'pairs'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {acceptedConnections.slice(0, 4).map(({ connection: c, source, target }) => (
              <div
                key={c.id}
                className="bg-white border border-[#e2dcd0] hover:border-[#b8caa0] p-4 rounded-2xl shadow-xs transition-all space-y-2.5"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-[#3d5a45] font-semibold">
                  <Link2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{c.reason}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div
                    onClick={() => setSelectedThoughtId(source.id)}
                    className="p-2.5 rounded-xl bg-[#faf8f4] hover:bg-[#f3f0e8] cursor-pointer text-[#233126] line-clamp-2 transition-colors border border-[#ede9df]"
                  >
                    "{source.text}"
                  </div>
                  <div
                    onClick={() => setSelectedThoughtId(target.id)}
                    className="p-2.5 rounded-xl bg-[#faf8f4] hover:bg-[#f3f0e8] cursor-pointer text-[#233126] line-clamp-2 transition-colors border border-[#ede9df]"
                  >
                    "{target.text}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Decorative Rolling Hills Artwork on Mobile */}
      <div className="sm:hidden pt-4 -mb-8">
        <RollingHillsFooterArt className="w-full h-12 opacity-75" />
      </div>

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
