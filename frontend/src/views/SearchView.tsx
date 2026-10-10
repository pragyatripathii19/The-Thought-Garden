import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Library, Clock, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { searchGarden } from '../lib/search';
import { formatRelativeTime } from '../lib/time';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { Thought, Collection } from '../types';

export const SearchView: React.FC = () => {
  const { thoughts, collections, setActiveCollectionId, updateThought, deleteThought } = useThoughts();
  const [query, setQuery] = useState('');
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  const results = useMemo(() => {
    return searchGarden(query, thoughts, collections);
  }, [query, thoughts, collections]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.matchingThoughts.length > 0 || results.matchingCollections.length > 0;

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      <div className="border-b border-[#eee9dc] pb-4">
        <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
          Search the Garden
        </h2>
        <p className="text-xs text-[#718273] mt-0.5">
          Find thoughts and collections by keywords, phrases, or themes
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#8b998d]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keywords, phrases, or collection titles..."
          className="w-full pl-12 pr-10 py-3.5 bg-white border border-[#e4ded0] rounded-2xl text-sm text-[#233126] placeholder-[#9ca89d] focus:border-[#7a9d83] focus:outline-hidden shadow-xs"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b998d] hover:text-[#233126] p-1 rounded-lg"
            aria-label="Clear query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Display */}
      {hasQuery ? (
        hasResults ? (
          <div className="space-y-6 animate-fade-in">
            {/* Matching Collections Section */}
            {results.matchingCollections.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#6e7d70] uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <Library className="w-3.5 h-3.5 text-[#3d5a45]" />
                  <span>Matching Collections ({results.matchingCollections.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.matchingCollections.map((col: Collection) => {
                    const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
                    return (
                      <div
                        key={col.id}
                        onClick={() => setActiveCollectionId(col.id)}
                        className="p-4 bg-white border border-[#e2dcd0] hover:border-[#b8caa0] rounded-2xl shadow-xs cursor-pointer transition-colors"
                      >
                        <h4 className="font-serif text-base font-semibold text-[#233126]">
                          {col.name}
                        </h4>
                        {col.description && (
                          <p className="text-xs text-[#6e7d70] mt-1 line-clamp-2 leading-relaxed">{col.description}</p>
                        )}
                        <div className="mt-2 text-xs text-[#869688]">
                          {count} {count === 1 ? 'thought' : 'thoughts'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matching Thoughts Section */}
            {results.matchingThoughts.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#6e7d70] uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#3d5a45]" />
                  <span>Matching Thoughts ({results.matchingThoughts.length})</span>
                </span>
                <div className="space-y-3">
                  {results.matchingThoughts.map((thought: Thought) => (
                    <div
                      key={thought.id}
                      onClick={() => setSelectedThoughtId(thought.id)}
                      className="p-4 bg-white border border-[#e2dcd0] hover:border-[#b8caa0] rounded-2xl shadow-xs cursor-pointer transition-colors flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#233126] group-hover:text-[#18231a] leading-relaxed whitespace-pre-wrap">
                          {thought.text}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#869688] mt-2">
                          <Clock className="w-3 h-3 text-[#9ba89d]" />
                          <span>{formatRelativeTime(thought.createdAt)}</span>
                        </div>
                      </div>
                      <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white border border-dashed border-[#e4ded0] rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-[#f4f1e8] text-[#8b998d] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-[#233126] mb-1">
              No matching thoughts found for "{query}"
            </h3>
            <p className="text-xs text-[#718273] max-w-sm mx-auto">
              Try searching for shorter fragments or individual words.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-[#e4ded0] rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-[#f4f1e8] text-[#8b998d] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-medium text-[#233126] mb-1">
            Looking for something?
          </h3>
          <p className="text-xs text-[#718273] max-w-sm mx-auto">
            Type any keyword or phrase you remember jotting down. Search works in real-time across your garden.
          </p>
        </div>
      )}

      {/* Detail Modal for clicking a search result thought */}
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
