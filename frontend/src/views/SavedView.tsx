import React, { useState, useMemo } from 'react';
import { Bookmark, ChevronRight, Search, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { formatRelativeTime } from '../lib/time';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { CollectionIcon } from '../components/CollectionIcon';
import { AutoBadge } from '../components/OrganizeToast';
import { NavTab } from '../types';

type SavedFilter = 'all' | 'thoughts' | 'collections';

interface SavedViewProps {
  onNavigateTab?: (tab: NavTab) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const SavedView: React.FC<SavedViewProps> = ({ onNavigateTab }) => {
  const { thoughts, collections, updateThought, deleteThought, setActiveCollectionId } = useThoughts();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SavedFilter>('all');
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const savedThoughts = useMemo(() => thoughts.filter((t) => t.isSaved), [thoughts]);
  const savedCollections = useMemo(() => collections.filter((c) => c.isSaved), [collections]);
  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;
  const totalSaved = savedThoughts.length + savedCollections.length;

  const q = query.trim().toLowerCase();
  const shownThoughts = useMemo(
    () => (filter === 'collections' ? [] : savedThoughts.filter((t) => !q || t.text.toLowerCase().includes(q))),
    [savedThoughts, filter, q]
  );
  const shownCollections = useMemo(
    () =>
      filter === 'thoughts'
        ? []
        : savedCollections.filter(
            (c) => !q || c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
          ),
    [savedCollections, filter, q]
  );

  const openCollection = (id: string) => {
    setActiveCollectionId(id);
    onNavigateTab?.('collections');
  };

  const filters: { id: SavedFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalSaved },
    { id: 'thoughts', label: 'Thoughts', count: savedThoughts.length },
    { id: 'collections', label: 'Collections', count: savedCollections.length },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="pb-1">
        <h2 className="font-serif text-[36px] sm:text-[42px] leading-tight font-semibold text-garden-ink tracking-tight">
          Saved
        </h2>
        <p className="text-sm text-garden-ink-soft mt-1">
          {plural(savedThoughts.length, 'thought')} and {plural(savedCollections.length, 'collection')} kept close
        </p>
      </div>

      {totalSaved === 0 ? (
        <div className="py-16 text-center bg-garden-card border border-dashed border-garden-line rounded-3xl p-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-garden-pill/60 text-garden-moss flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-serif text-xl font-semibold text-garden-ink">Nothing saved yet</p>
          <p className="text-sm text-garden-ink-soft max-w-sm mx-auto leading-relaxed">
            Tap the bookmark on any thought or collection to keep it here for easy return.
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1.5" role="group" aria-label="Show">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                    filter === f.id
                      ? 'bg-garden-moss text-garden-paper border-garden-moss font-semibold'
                      : 'bg-garden-card text-garden-ink-soft border-garden-line hover:border-[#D6CAA6]'
                  }`}
                >
                  {f.label} <span className="opacity-70">{f.count}</span>
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-garden-ink-faint" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter saved items…"
                aria-label="Filter saved items"
                className="w-full pl-10 pr-9 py-2 bg-garden-card border border-garden-line rounded-full text-sm text-garden-ink placeholder-garden-ink-faint focus:border-[#BFB38F] focus:outline-none"
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
          </div>

          {shownThoughts.length === 0 && shownCollections.length === 0 ? (
            <div className="py-12 text-center bg-garden-card border border-dashed border-garden-line rounded-3xl p-6 space-y-2">
              <p className="font-serif text-xl font-semibold text-garden-ink">Nothing matches</p>
              <p className="text-sm text-garden-ink-soft">
                {q ? `No saved ${filter === 'all' ? 'items' : filter} match "${query}".` : `No saved ${filter} yet.`}
              </p>
              {q && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-sm text-garden-moss underline underline-offset-2"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {shownCollections.length > 0 && (
                <section className="space-y-3" aria-label="Saved collections">
                  {filter === 'all' && (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">Collections</h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shownCollections.map((col) => {
                      const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => openCollection(col.id)}
                          className="bg-garden-card border border-garden-line hover:border-[#D6CAA6] p-4 rounded-2xl flex items-center gap-3.5 text-left transition-colors group"
                        >
                          <CollectionIcon collection={col} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-xl leading-tight font-semibold text-garden-ink truncate">
                              {col.name}
                              {col.origin === 'auto' && <AutoBadge className="ml-1.5 align-middle" />}
                            </h4>
                            <p className="text-xs text-garden-ink-faint mt-0.5">{plural(count, 'thought')}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-garden-ink-faint group-hover:text-garden-moss shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {shownThoughts.length > 0 && (
                <section className="space-y-3" aria-label="Saved thoughts">
                  {filter === 'all' && (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">Thoughts</h3>
                  )}
                  {shownThoughts.map((thought) => (
                    <div
                      key={thought.id}
                      onClick={() => setSelectedThoughtId(thought.id)}
                      className="bg-garden-card border border-garden-line hover:border-[#D6CAA6] p-4 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-garden-ink leading-relaxed whitespace-pre-wrap">{thought.text}</p>
                        <div className="flex items-center gap-2 text-[11px] text-garden-ink-faint mt-2">
                          <span>{formatRelativeTime(thought.createdAt)}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-garden-moss font-medium">
                            <Bookmark className="w-3 h-3 fill-current" />
                            Saved
                          </span>
                        </div>
                      </div>
                      <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
        </>
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
