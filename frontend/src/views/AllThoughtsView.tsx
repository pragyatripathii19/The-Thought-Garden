import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Sprout,
  ArrowUpDown,
  Leaf,
  Flower2,
  Sparkles,
} from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { GrowthStage } from '../types';
import { formatRelativeTime } from '../lib/time';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';

type SortOption = 'newest' | 'oldest' | 'stage';

const STAGE_ORDER: Record<GrowthStage, number> = {
  seed: 0,
  sprout: 1,
  bloom: 2,
  mature: 3,
};

const STAGE_FILTERS: { label: string; value: GrowthStage | 'all'; icon?: React.ComponentType<{ className?: string }> }[] = [
  { label: 'All', value: 'all' },
  { label: 'Seed', value: 'seed', icon: Sprout },
  { label: 'Sprout', value: 'sprout', icon: Leaf },
  { label: 'Bloom', value: 'bloom', icon: Flower2 },
  { label: 'Mature', value: 'mature', icon: Sparkles },
];

export const AllThoughtsView: React.FC = () => {
  const { thoughts, collections, updateThought, deleteThought } = useThoughts();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<GrowthStage | 'all'>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  const filtered = useMemo(() => {
    let list = [...thoughts];

    // Text filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.text.toLowerCase().includes(q));
    }

    // Stage filter
    if (stageFilter !== 'all') {
      list = list.filter((t) => (t.stage || 'seed') === stageFilter);
    }

    // Collection filter
    if (collectionFilter !== 'all') {
      list = list.filter((t) => t.collectionIds?.includes(collectionFilter));
    }

    // Sort
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'stage') {
      list.sort((a, b) => STAGE_ORDER[b.stage || 'seed'] - STAGE_ORDER[a.stage || 'seed']);
    }

    return list;
  }, [thoughts, query, stageFilter, collectionFilter, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    stage: 'By stage',
  };

  const cycleSortOption = () => {
    const options: SortOption[] = ['newest', 'oldest', 'stage'];
    const next = options[(options.indexOf(sortBy) + 1) % options.length];
    setSortBy(next);
  };

  return (
    <div className="space-y-5 pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#eee9dc] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
              All Thoughts
            </h2>
            <p className="text-xs text-[#718273] mt-0.5">
              {thoughts.length} {thoughts.length === 1 ? 'thought' : 'thoughts'} in your garden
            </p>
          </div>
          <button
            type="button"
            onClick={cycleSortOption}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#556657] bg-[#edf5ee] hover:bg-[#e0ebe2] border border-[#d4e4d7] rounded-xl font-medium transition-colors"
            title={`Sort: ${sortLabels[sortBy]}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortLabels[sortBy]}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b998d]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by keyword..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#e4ded0] rounded-2xl text-sm text-[#233126] placeholder-[#9ca89d] focus:border-[#7a9d83] focus:outline-hidden shadow-xs"
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

      {/* Filters Row */}
      <div className="space-y-2.5">
        {/* Stage filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#8b998d] shrink-0" />
          {STAGE_FILTERS.map((sf) => {
            const Icon = sf.icon;
            const isActive = stageFilter === sf.value;
            return (
              <button
                key={sf.value}
                type="button"
                onClick={() => setStageFilter(sf.value as GrowthStage | 'all')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  isActive
                    ? 'bg-[#3d5a45] text-white border-[#3d5a45]'
                    : 'bg-white text-[#556657] border-[#e4ded0] hover:border-[#b8caa0]'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {sf.label}
              </button>
            );
          })}
        </div>

        {/* Collection filter */}
        {collections.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#8b998d] font-medium shrink-0">Collection:</span>
            <button
              type="button"
              onClick={() => setCollectionFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                collectionFilter === 'all'
                  ? 'bg-[#3d5a45] text-white border-[#3d5a45]'
                  : 'bg-white text-[#556657] border-[#e4ded0] hover:border-[#b8caa0]'
              }`}
            >
              All
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setCollectionFilter(collectionFilter === col.id ? 'all' : col.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  collectionFilter === col.id
                    ? 'bg-[#3d5a45] text-white border-[#3d5a45]'
                    : 'bg-white text-[#556657] border-[#e4ded0] hover:border-[#b8caa0]'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {(query || stageFilter !== 'all' || collectionFilter !== 'all') && (
        <p className="text-xs text-[#718273]">
          Showing <strong>{filtered.length}</strong> of {thoughts.length} thoughts
        </p>
      )}

      {/* Thoughts List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-[#e4ded0] rounded-3xl p-6 space-y-2">
          <Sprout className="w-8 h-8 mx-auto text-[#628469] opacity-80" />
          <p className="font-serif text-base font-semibold text-[#253227]">
            {thoughts.length === 0 ? 'Your garden starts with one thought' : 'No thoughts match these filters'}
          </p>
          <p className="text-xs text-[#718273] max-w-xs mx-auto leading-relaxed">
            {thoughts.length === 0
              ? 'Capture any fragment from the Home screen to begin.'
              : 'Try clearing some filters to see more results.'}
          </p>
          {(query || stageFilter !== 'all' || collectionFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setQuery(''); setStageFilter('all'); setCollectionFilter('all'); }}
              className="text-xs text-[#34593e] underline underline-offset-2 mt-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#e2dcd0] rounded-2xl divide-y divide-[#f2ede3] shadow-xs overflow-hidden">
          {filtered.map((thought) => (
            <div
              key={thought.id}
              onClick={() => setSelectedThoughtId(thought.id)}
              className="p-3.5 sm:p-4 hover:bg-[#faf8f4] cursor-pointer transition-colors flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-[#233126] group-hover:text-[#18231a] leading-relaxed">
                  {thought.text}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-[#869688]">
                    {formatRelativeTime(thought.createdAt)}
                  </span>
                  {thought.collectionIds?.length > 0 && (
                    <>
                      <span className="text-[#c8d3c9]">•</span>
                      {thought.collectionIds.slice(0, 2).map((cid) => {
                        const col = collections.find((c) => c.id === cid);
                        return col ? (
                          <span key={cid} className="text-[11px] text-[#718273]">{col.name}</span>
                        ) : null;
                      })}
                    </>
                  )}
                  {thought.isSaved && (
                    <>
                      <span className="text-[#c8d3c9]">•</span>
                      <span className="text-[11px] text-amber-700">📌</span>
                    </>
                  )}
                </div>
              </div>
              <GrowthStageBadge
                stage={thought.stage || 'seed'}
                size="sm"
                showLabel={true}
                onClick={() => {
                  const stages: GrowthStage[] = ['seed', 'sprout', 'bloom', 'mature'];
                  const currentIndex = stages.indexOf(thought.stage || 'seed');
                  const nextStage = stages[(currentIndex + 1) % stages.length];
                  updateThought(thought.id, { stage: nextStage });
                }}
              />
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
