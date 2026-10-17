import React from 'react';
import { Home, Library, Search, Bookmark, BookOpen } from 'lucide-react';
import { NavTab } from '../types';
import { LeafLogoIcon } from './BotanicalIllustrations';
import { getDailyQuote } from '../lib/quotes';
import { ART } from '../lib/art';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

// Settings lives in the avatar menu (top right), so the sidebar stays at five tabs.
const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'garden', label: 'Home', icon: Home },
  { id: 'thoughts', label: 'All Thoughts', icon: BookOpen },
  { id: 'collections', label: 'Collections', icon: Library },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => (
  <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto overflow-x-hidden bg-garden-sidebar/80 border-r border-garden-line select-none">
    <div className="px-5 pt-7 space-y-9">
      {/* Brand: stacked serif wordmark with a sprig */}
      <button
        type="button"
        onClick={() => onTabChange('garden')}
        className="flex items-start gap-1.5 px-2 text-left group"
        aria-label="The Thought Garden, go to Home"
      >
        <span className="font-serif text-[27px] font-semibold leading-[0.95] tracking-tight text-garden-ink group-hover:text-garden-moss transition-colors">
          The
          <br />
          Thought
          <br />
          Garden
        </span>
        <LeafLogoIcon className="w-6 h-6 mt-6 text-garden-moss -rotate-12" />
      </button>

      <nav className="space-y-1" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[15px] transition-colors text-left ${
                isActive
                  ? 'bg-garden-pill text-garden-ink font-semibold'
                  : 'text-garden-ink-soft hover:text-garden-ink hover:bg-garden-paper-deep/70'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-garden-moss' : 'text-garden-ink-faint'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>

    {/* Space, then the quote and the tree at the bottom */}
    <div className="mt-auto pt-10 space-y-5">
      <figure className="px-8">
        <blockquote className="font-serif italic text-[16px] leading-snug text-garden-ink-soft">
          {getDailyQuote()}
        </blockquote>
      </figure>
      <div className="px-6 pointer-events-none flex justify-center" aria-hidden="true">
        <img src={ART.tree} alt="" className="w-44 max-h-[34vh] object-contain object-bottom -mb-1" />
      </div>
    </div>
  </aside>
);
