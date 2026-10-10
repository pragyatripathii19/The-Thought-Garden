import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';

export const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      <div>
        <h2 className="font-serif text-3xl font-semibold text-earth-900 tracking-tight">
          Search the Garden
        </h2>
        <p className="text-sm text-stone-400 mt-1">
          Find thoughts and collections by approximate phrasing or keywords
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
          className="w-full pl-12 pr-4 py-4 bg-white border border-parchment-border rounded-2xl text-base text-earth-800 placeholder-stone-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-200 shadow-soft transition-all"
        />
      </div>

      {/* Empty State */}
      <div className="text-center py-16 px-4 bg-white/40 border border-dashed border-parchment-border rounded-3xl">
        <div className="w-12 h-12 rounded-full bg-parchment-soft text-stone-400 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-lg font-medium text-earth-800 mb-1">
          {query ? `No matching thoughts found for "${query}"` : 'Looking for something?'}
        </h3>
        <p className="text-xs text-stone-400 max-w-sm mx-auto">
          {query
            ? 'Try searching for shorter fragments or individual words.'
            : 'Type any word or phrase you remember jotting down.'}
        </p>
      </div>
    </div>
  );
};
