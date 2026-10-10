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
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#eee9dc] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#fbf3e4] text-[#8f5a23] flex items-center justify-center">
            <Bookmark className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
              Saved Thoughts
            </h2>
            <p className="text-xs text-[#718273] mt-0.5">
              {savedThoughts.length} {savedThoughts.length === 1 ? 'thought' : 'thoughts'} pinned in your garden
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter Bar (if there are saved thoughts) */}
      {savedThoughts.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b998d]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter saved thoughts..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#e4ded0] rounded-2xl text-xs text-[#233126] placeholder-[#9ca89d] focus:border-[#7a9d83] focus:outline-hidden shadow-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b998d] hover:text-[#233126] p-1 rounded-lg"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Thought List or Empty State */}
      {savedThoughts.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-[#e4ded0] rounded-3xl p-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#faf8f2] text-[#8f5a23] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-serif text-base font-semibold text-[#253227]">
            No saved thoughts yet
          </p>
          <p className="text-xs text-[#718273] max-w-sm mx-auto leading-relaxed">
            When you inspect any thought, tap the 📌 bookmark icon to pin it here for easy return.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white border border-dashed border-[#e4ded0] rounded-3xl p-6 space-y-2">
          <p className="font-serif text-base font-semibold text-[#253227]">
            No matching saved thoughts
          </p>
          <p className="text-xs text-[#718273]">
            No pinned thoughts matched "{query}".
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-xs text-[#34593e] underline underline-offset-2 mt-1"
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
              className="bg-white border border-[#e2dcd0] hover:border-[#b8caa0] p-4 rounded-2xl shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#233126] group-hover:text-[#18231a] leading-relaxed whitespace-pre-wrap">
                  {thought.text}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#869688] mt-2">
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
      />
    </div>
  );
};
