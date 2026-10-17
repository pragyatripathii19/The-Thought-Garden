import React from 'react';
import { Home, Library, Search, Bookmark, Plus } from 'lucide-react';
import { NavTab } from '../types';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewThought: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewThought,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-garden-paper/95 backdrop-blur-md border-t border-garden-line px-4 py-2 flex items-center justify-around select-none"
      aria-label="Mobile Navigation"
    >
      {/* Home */}
      <button
        type="button"
        onClick={() => onTabChange('garden')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
          activeTab === 'garden' ? 'text-garden-moss font-semibold' : 'text-garden-ink-faint'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>

      {/* Collections */}
      <button
        type="button"
        onClick={() => onTabChange('collections')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
          activeTab === 'collections' ? 'text-garden-moss font-semibold' : 'text-garden-ink-faint'
        }`}
      >
        <Library className="w-5 h-5" />
        <span>Collections</span>
      </button>

      {/* Elevated Center Capture Button (+) */}
      <div className="-mt-7">
        <button
          type="button"
          onClick={onOpenNewThought}
          className="w-12 h-12 rounded-full bg-garden-moss text-[#F4EEDB] flex items-center justify-center shadow-soft-md ring-4 ring-garden-paper active:scale-95 transition-transform hover:bg-garden-moss-dark"
          title="Plant New Thought"
          aria-label="Plant New Thought"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Search */}
      <button
        type="button"
        onClick={() => onTabChange('search')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
          activeTab === 'search' ? 'text-garden-moss font-semibold' : 'text-garden-ink-faint'
        }`}
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </button>

      {/* Saved (Settings is in the avatar menu, as on desktop) */}
      <button
        type="button"
        onClick={() => onTabChange('saved')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
          activeTab === 'saved' ? 'text-garden-moss font-semibold' : 'text-garden-ink-faint'
        }`}
      >
        <Bookmark className="w-5 h-5" />
        <span>Saved</span>
      </button>
    </nav>
  );
};
