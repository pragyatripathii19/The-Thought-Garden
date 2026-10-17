import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Library, Clock, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { searchGarden } from '../lib/search';
import { formatRelativeTime } from '../lib/time';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { Thought, Collection, NavTab } from '../types';
import { ART } from '../lib/art';

interface SearchViewProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onNavigateTab }) => {
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
    <div className="relative z-10 space-y-6 pb-16">
      <div className="relative pt-2">
        <h2 className="relative font-serif text-[34px] sm:text-[40px] leading-tight font-semibold text-garden-ink tracking-tight">
          Search the Garden
        </h2>
        <p className="relative text-sm text-garden-ink-soft mt-1">
          Find thoughts and collections by keywords, phrases, or themes
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-garden-ink-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by keywords, phrases, or collection titles..."
          className="w-full pl-12 pr-10 py-3.5 bg-garden-card border border-garden-line rounded-2xl text-sm text-garden-ink placeholder-garden-ink-faint focus:border-[#BFB38F] focus:outline-none"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-garden-ink-faint hover:text-garden-ink p-1 rounded-lg"
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
                <span className="text-xs font-semibold text-garden-ink-soft uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <Library className="w-3.5 h-3.5 text-garden-moss" />
                  <span>Matching Collections ({results.matchingCollections.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.matchingCollections.map((col: Collection) => {
                    const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
                    return (
                      <div
                        key={col.id}
                        onClick={() => {
                          setActiveCollectionId(col.id);
                          onNavigateTab?.('collections');
                        }}
                        className="p-4 bg-garden-card border border-garden-line hover:border-[#D6CAA6] rounded-2xl cursor-pointer transition-colors"
                      >
                        <h4 className="font-serif text-xl font-semibold text-garden-ink">
                          {col.name}
                        </h4>
                        {col.description && (
                          <p className="text-xs text-garden-ink-soft mt-1 line-clamp-2 leading-relaxed">{col.description}</p>
                        )}
                        <div className="mt-2 text-xs text-garden-ink-faint">
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
                <span className="text-xs font-semibold text-garden-ink-soft uppercase tracking-wider flex items-center gap-1.5 px-1">
                  <BookOpen className="w-3.5 h-3.5 text-garden-moss" />
                  <span>Matching Thoughts ({results.matchingThoughts.length})</span>
                </span>
                <div className="space-y-3">
                  {results.matchingThoughts.map((thought: Thought) => (
                    <div
                      key={thought.id}
                      onClick={() => setSelectedThoughtId(thought.id)}
                      className="p-4 bg-garden-card border border-garden-line hover:border-[#D6CAA6] rounded-2xl cursor-pointer transition-colors flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-garden-ink group-hover:text-garden-ink leading-relaxed whitespace-pre-wrap">
                          {thought.text}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-garden-ink-faint mt-2">
                          <Clock className="w-3 h-3 text-garden-ink-faint" />
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
          <div className="text-center py-16 px-4 bg-garden-card border border-dashed border-garden-line rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-garden-paper-deep text-garden-ink-faint flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-garden-ink mb-1">
              No matching thoughts found for "{query}"
            </h3>
            <p className="text-xs text-garden-ink-soft max-w-sm mx-auto">
              Try searching for shorter fragments or individual words.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-16 px-4 bg-garden-card border border-dashed border-garden-line rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-garden-paper-deep text-garden-ink-faint flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-garden-ink mb-1">
            Looking for something?
          </h3>
          <p className="text-xs text-garden-ink-soft max-w-sm mx-auto">
            Type any keyword or phrase you remember jotting down. Search works in real-time across your garden.
          </p>
          {collections.length > 0 && (
            <div className="pt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
              <span className="text-[11px] text-garden-ink-faint w-full text-center mb-1">
                Quick search by collection:
              </span>
              {collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setQuery(c.name)}
                  className="px-2.5 py-1 text-xs rounded-full bg-garden-paper-deep hover:bg-garden-line text-garden-moss font-medium border border-garden-line transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* A cat in the corner, looking up at the search box. On desktop it sits behind
          the results in the empty space beside them; on phones the results are full
          width and would cover it, so there it sits below them in the page. */}
      <img
        src={ART.cat}
        alt=""
        aria-hidden="true"
        className="md:hidden block ml-auto w-[5.5rem] pt-2 pointer-events-none select-none"
      />
      <img
        src={ART.cat}
        alt=""
        aria-hidden="true"
        className="hidden md:block fixed -z-10 right-8 bottom-0 w-40 pointer-events-none select-none"
      />

      {/* Detail Modal for clicking a search result thought */}
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
