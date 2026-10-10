import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Library, Clock, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { searchGarden } from '../lib/search';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { Thought, Collection } from '../types';

export const SearchView: React.FC = () => {
  const { thoughts, collections, updateThought, deleteThought } = useThoughts();
  const [query, setQuery] = useState('');
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  const results = useMemo(() => {
    return searchGarden(query, thoughts, collections);
  }, [query, thoughts, collections]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.matchingThoughts.length > 0 || results.matchingCollections.length > 0;

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-earth-900 tracking-tight">
          Search the Garden
        </h2>
        <p className="text-sm text-stone-400 mt-1">
          Find thoughts and collections by approximate phrasing, keywords, or themes
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keywords, phrases, or collection titles..."
          className="w-full pl-12 pr-10 py-4 bg-white border border-parchment-border rounded-2xl text-base text-earth-800 placeholder-stone-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-200 shadow-soft transition-all"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-earth-900 p-1 rounded-lg"
            aria-label="Clear query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Display */}
      {hasQuery ? (
        hasResults ? (
          <div className="space-y-8 animate-fade-in">
            {/* Matching Collections Section */}
            {results.matchingCollections.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs uppercase font-semibold text-stone-400 tracking-wider flex items-center gap-1.5 px-1">
                  <Library className="w-3.5 h-3.5 text-sage-600" />
                  <span>Matching Collections ({results.matchingCollections.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.matchingCollections.map((col: Collection) => {
                    const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
                    return (
                      <div
                        key={col.id}
                        className="p-4 bg-white border border-parchment-border rounded-2xl shadow-soft"
                      >
                        <h4 className="font-serif text-base font-semibold text-earth-900">
                          {col.name}
                        </h4>
                        {col.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{col.description}</p>
                        )}
                        <div className="mt-3 text-xs text-stone-400">
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
                <span className="text-xs uppercase font-semibold text-stone-400 tracking-wider flex items-center gap-1.5 px-1">
                  <BookOpen className="w-3.5 h-3.5 text-sage-600" />
                  <span>Matching Thoughts ({results.matchingThoughts.length})</span>
                </span>
                <div className="space-y-3">
                  {results.matchingThoughts.map((thought: Thought) => (
                    <div
                      key={thought.id}
                      onClick={() => setSelectedThoughtId(thought.id)}
                      className="p-5 bg-white border border-parchment-border hover:border-sage-400 rounded-2xl shadow-soft hover:shadow-soft-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <p className="text-earth-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {thought.text}
                      </p>
                      <div className="mt-3 pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs text-stone-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          {formatTimestamp(thought.createdAt)}
                        </span>
                        <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white/40 border border-dashed border-parchment-border rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-parchment-soft text-stone-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-earth-800 mb-1">
              No matching thoughts found for "{query}"
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              Try searching for shorter fragments or individual words.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-16 px-4 bg-white/40 border border-dashed border-parchment-border rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-parchment-soft text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-medium text-earth-800 mb-1">
            Looking for something?
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
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
