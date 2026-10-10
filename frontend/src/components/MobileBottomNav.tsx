import React from 'react';
import { Home, Library, Search, SlidersHorizontal, Plus } from 'lucide-react';
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f3]/95 backdrop-blur-md border-t border-[#ece7dd] px-4 py-2 flex items-center justify-around select-none shadow-md"
      aria-label="Mobile Navigation"
    >
      {/* Home */}
      <button
        type="button"
        onClick={() => onTabChange('garden')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
          activeTab === 'garden' ? 'text-[#385440]' : 'text-[#7d8b7e]'
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
          activeTab === 'collections' ? 'text-[#385440]' : 'text-[#7d8b7e]'
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
          className="w-12 h-12 rounded-full bg-[#344e3b] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-[#2b4131]"
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
          activeTab === 'search' ? 'text-[#385440]' : 'text-[#7d8b7e]'
        }`}
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </button>

      {/* Profile / Settings */}
      <button
        type="button"
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
          activeTab === 'settings' ? 'text-[#385440]' : 'text-[#7d8b7e]'
        }`}
      >
        <SlidersHorizontal className="w-5 h-5" />
        <span>Settings</span>
      </button>
    </nav>
  );
};
