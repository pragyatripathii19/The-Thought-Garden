import React, { useState } from 'react';
import { ArrowRight, Sprout, Trees, History, Check, Trash2, Clock, ChevronRight, Sparkles, X, Link2 } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';

export const GardenView: React.FC = () => {
  const {
    thoughts,
    suggestedConnection,
    rediscoveredThought,
    dismissRediscoveredThought,
    createThought,
    updateThought,
    deleteThought,
    acceptConnection,
    dismissConnection,
    isLoading,
    error,
  } = useThoughts();

  const [input, setInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justPlanted, setJustPlanted] = useState(false);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  const handlePlant = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSaving) return;

    try {
      setIsSaving(true);
      await createThought(trimmed);
      setInput('');
      setJustPlanted(true);
      setTimeout(() => setJustPlanted(false), 2500);
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

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Quick Capture Hero Section */}
      <section className="bg-white/80 backdrop-blur-sm border border-parchment-border rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-sage-600 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-sage-500" />
              Plant a thought
            </span>
            <span className="text-xs text-stone-400">
              No title or tags needed
            </span>
          </div>

          {/* Capture Surface */}
          <div className="relative">
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder="What's on your mind? Jot down an unfinished idea, question, or fragment..."
              className="w-full bg-parchment-soft/60 focus:bg-white text-earth-800 placeholder-stone-400 text-base sm:text-lg rounded-2xl p-4 sm:p-5 border border-parchment-border focus:border-sage-400 focus:ring-2 focus:ring-sage-200 transition-all resize-none leading-relaxed disabled:opacity-75"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-stone-400 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 bg-parchment-soft rounded border border-parchment-border font-mono text-[10px] text-stone-500">Ctrl + Enter</kbd> to plant
            </p>
            
            <div className="ml-auto flex items-center gap-3">
              {justPlanted && (
                <span className="inline-flex items-center gap-1 text-xs text-sage-600 font-medium animate-fade-in">
                  <Check className="w-4 h-4 text-sage-500" />
                  Planted in garden
                </span>
              )}

              <button
                type="button"
                onClick={handlePlant}
                disabled={!input.trim() || isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white rounded-xl text-sm font-medium shadow-soft transition-all"
              >
                <span>{isSaving ? 'Planting...' : 'Plant thought'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Connection Card (Piece 5) */}
      {suggestedConnection && (
        <section className="bg-gradient-to-tr from-sage-50/90 to-moss-50/70 border border-sage-200/90 rounded-3xl p-6 sm:p-7 shadow-soft animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sage-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-earth-900">
                  This might connect to…
                </h3>
                <p className="text-xs text-sage-800 font-medium mt-0.5">
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
              className="p-1 text-stone-400 hover:text-earth-900 rounded-lg"
              title="Dismiss suggestion"
              aria-label="Dismiss suggestion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Two Connected Thought Snippets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => setSelectedThoughtId(suggestedConnection.sourceThought.id)}
              className="p-4 bg-white/90 hover:bg-white rounded-2xl border border-sage-200/80 cursor-pointer shadow-soft transition-all"
            >
              <p className="text-earth-900 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                {suggestedConnection.sourceThought.text}
              </p>
              <div className="mt-2 text-[10px] text-stone-400 flex items-center justify-between">
                <span>{formatTimestamp(suggestedConnection.sourceThought.createdAt)}</span>
                <GrowthStageBadge stage={suggestedConnection.sourceThought.stage || 'seed'} size="sm" />
              </div>
            </div>

            <div
              onClick={() => setSelectedThoughtId(suggestedConnection.targetThought.id)}
              className="p-4 bg-white/90 hover:bg-white rounded-2xl border border-sage-200/80 cursor-pointer shadow-soft transition-all"
            >
              <p className="text-earth-900 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                {suggestedConnection.targetThought.text}
              </p>
              <div className="mt-2 text-[10px] text-stone-400 flex items-center justify-between">
                <span>{formatTimestamp(suggestedConnection.targetThought.createdAt)}</span>
                <GrowthStageBadge stage={suggestedConnection.targetThought.stage || 'seed'} size="sm" />
              </div>
            </div>
          </div>

          {/* Accept / Dismiss Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                dismissConnection(
                  suggestedConnection.sourceThought.id,
                  suggestedConnection.targetThought.id
                )
              }
              className="px-3.5 py-1.5 text-xs text-stone-500 hover:text-earth-900 rounded-xl hover:bg-parchment-soft/80 transition-colors"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-700 hover:bg-sage-800 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Confirm Connection</span>
            </button>
          </div>
        </section>
      )}

      {/* Gentle Rediscovery Card (Piece 6) */}
      {rediscoveredThought && (
        <section className="bg-gradient-to-tr from-[#fcfbf7] to-[#f7f5ed] border border-[#e3decb] rounded-3xl p-6 sm:p-7 shadow-soft animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#e8e4d8] text-[#556354] flex items-center justify-center">
                <History className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-earth-900">
                  A thought to revisit
                </h3>
                <p className="text-xs text-stone-500">
                  Planted on {new Date(rediscoveredThought.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dismissRediscoveredThought(rediscoveredThought.id)}
              className="p-1 text-stone-400 hover:text-earth-900 rounded-lg"
              title="Dismiss for now"
              aria-label="Dismiss for now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            onClick={() => setSelectedThoughtId(rediscoveredThought.id)}
            className="p-4 bg-white/90 hover:bg-white rounded-2xl border border-[#e3decb] cursor-pointer shadow-soft transition-all"
          >
            <p className="text-earth-900 text-xs sm:text-sm line-clamp-3 leading-relaxed whitespace-pre-wrap">
              {rediscoveredThought.text}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <GrowthStageBadge stage={rediscoveredThought.stage || 'seed'} size="sm" />
              <span className="text-xs text-sage-600 font-medium inline-flex items-center gap-1">
                Inspect Thought
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => dismissRediscoveredThought(rediscoveredThought.id)}
              className="px-3.5 py-1.5 text-xs text-stone-500 hover:text-earth-900 rounded-xl hover:bg-parchment-soft/80 transition-colors"
            >
              Dismiss for now
            </button>

            <button
              type="button"
              onClick={() => setSelectedThoughtId(rediscoveredThought.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-700 hover:bg-sage-800 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
            >
              <span>Inspect Thought</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* Thought Stream or First-Run Empty State */}
      {isLoading ? (
        <div className="text-center py-12 text-stone-400 text-sm">
          Tending the garden...
        </div>
      ) : thoughts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-2xl font-semibold text-earth-900">
              Recent Thoughts
            </h2>
            <span className="text-xs text-stone-400">
              {thoughts.length} {thoughts.length === 1 ? 'thought' : 'thoughts'} in garden
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thoughts.map((thought) => (
              <div
                key={thought.id}
                onClick={() => setSelectedThoughtId(thought.id)}
                className="group relative bg-white border border-parchment-border hover:border-sage-400/80 rounded-2xl p-5 shadow-soft hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between cursor-pointer text-left"
              >
                {/* Verbatim thought text */}
                <p className="text-earth-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap line-clamp-4 group-hover:text-earth-950">
                  {thought.text}
                </p>

                {/* Footer metadata & actions */}
                <div className="mt-4 pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatTimestamp(thought.createdAt)}
                    </span>
                    <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThought(thought.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 rounded-lg transition-all"
                      title="Remove thought"
                      aria-label="Remove thought"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-sage-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* Gentle First-Run Empty Garden Banner */
        <section className="text-center py-12 px-4 rounded-3xl bg-gradient-to-b from-parchment-soft/40 to-transparent border border-dashed border-parchment-border/80">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-50 border border-sage-100 text-sage-600 mb-4 shadow-soft">
            <Sprout className="w-8 h-8 text-sage-500 animate-pulse" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-earth-900 mb-2">
            Your garden starts with one thought
          </h2>
          <p className="text-sm sm:text-base text-stone-400 max-w-md mx-auto leading-relaxed">
            Put down any fleeting thought above. As ideas accumulate, gentle connections and natural collections will begin to sprout.
          </p>
        </section>
      )}

      {/* Thought Detail & Edit Modal */}
      <ThoughtDetailModal
        thought={selectedThought}
        isOpen={Boolean(selectedThought)}
        onClose={() => setSelectedThoughtId(null)}
        onUpdate={updateThought}
        onDelete={deleteThought}
      />

      {/* The 3 Pillars (from Product Flow Reference) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white/60 border border-parchment-border rounded-2xl p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-sage-100/70 text-sage-700 flex items-center justify-center mb-4">
            <Sprout className="w-5 h-5 text-sage-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-900 mb-1.5">
            1. Plant a thought
          </h3>
          <p className="text-xs font-medium text-sage-600 mb-2">Capture first. Organize later.</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            One simple writing surface. A thought can remain a tiny, unfinished fragment indefinitely without pressure.
          </p>
        </div>

        <div className="bg-white/60 border border-parchment-border rounded-2xl p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-moss-100/70 text-moss-600 flex items-center justify-center mb-4">
            <Trees className="w-5 h-5 text-moss-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-900 mb-1.5">
            2. Watch thoughts grow
          </h3>
          <p className="text-xs font-medium text-moss-600 mb-2">Collections emerge naturally.</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Transparent suggestions notice shared themes and explain why. Accept or dismiss them; your words stay intact.
          </p>
        </div>

        <div className="bg-white/60 border border-parchment-border rounded-2xl p-6 shadow-soft hover:shadow-soft-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-clay-100/70 text-clay-600 flex items-center justify-center mb-4">
            <History className="w-5 h-5 text-clay-600" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-earth-900 mb-1.5">
            3. Return to what matters
          </h3>
          <p className="text-xs font-medium text-clay-600 mb-2">Old ideas get another chance.</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            Rediscover thoughts you wrote weeks ago. No streaks, no guilt, and no forced conversion into tasks.
          </p>
        </div>
      </section>
    </div>
  );
};
