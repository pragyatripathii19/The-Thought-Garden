import React, { useState, useMemo } from 'react';
import { Bookmark, Search, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { formatRelativeTime } from '../lib/time';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { GrowthStageBadge } from '../components/GrowthStageBadge';

export const SavedView: React.FC = () => {
  const { thoughts, updateThought, deleteThought } = useThoughts();
  const [query, setQuery] = useState('');
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const savedThoughts = thoughts.filter((t) => t.isSaved);
  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  const filtered = useMemo(() => {
    if (!query.trim()) return savedThoughts;
    const q = query.toLowerCase();
    return savedThoughts.filter((t) => t.text.toLowerCase().includes(q));
  }, [savedThoughts, query]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-garden-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-garden-pill/70 text-garden-moss flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="font-serif text-[36px] sm:text-[42px] leading-tight font-semibold text-garden-ink tracking-tight">
              Saved Thoughts
            </h2>
            <p className="text-sm text-garden-ink-soft mt-1">
              {savedThoughts.length} {savedThoughts.length === 1 ? 'thought' : 'thoughts'} pinned in your garden
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter Bar (if there are saved thoughts) */}
      {savedThoughts.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-garden-ink-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter saved thoughts..."
            className="w-full pl-10 pr-9 py-2.5 bg-garden-card border border-garden-line rounded-2xl text-xs text-garden-ink placeholder-garden-ink-faint focus:border-[#BFB38F] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-garden-ink-faint hover:text-garden-ink p-1 rounded-lg"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Thought List or Empty State */}
      {savedThoughts.length === 0 ? (
        <div className="py-16 text-center bg-garden-card border border-dashed border-garden-line rounded-3xl p-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FDFBF3] text-[#8f5a23] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-serif text-xl font-semibold text-garden-ink">
            No saved thoughts yet
          </p>
          <p className="text-xs text-garden-ink-soft max-w-sm mx-auto leading-relaxed">
            When you inspect any thought, tap the 📌 bookmark icon to pin it here for easy return.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-garden-card border border-dashed border-garden-line rounded-3xl p-6 space-y-2">
          <p className="font-serif text-xl font-semibold text-garden-ink">
            No matching saved thoughts
          </p>
          <p className="text-xs text-garden-ink-soft">
            No pinned thoughts matched "{query}".
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-xs text-garden-moss underline underline-offset-2 mt-1"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((thought) => (
            <div
              key={thought.id}
              onClick={() => setSelectedThoughtId(thought.id)}
              className="bg-garden-card border border-garden-line hover:border-[#D6CAA6] p-4 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-garden-ink group-hover:text-garden-ink leading-relaxed whitespace-pre-wrap">
                  {thought.text}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-garden-ink-faint mt-2">
                  <span>{formatRelativeTime(thought.createdAt)}</span>
                  <span>•</span>
                  <span className="text-amber-800 font-medium">📌 Saved</span>
                </div>
              </div>

              <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
            </div>
          ))}
        </div>
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
  );
};
