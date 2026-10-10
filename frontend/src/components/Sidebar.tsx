import React, { useState } from 'react';
import { Home, Library, Search, Bookmark, SlidersHorizontal, Compass, X } from 'lucide-react';
import { NavTab } from '../types';
import { LeafLogoIcon } from './BotanicalIllustrations';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isLearnModalOpen, setIsLearnModalOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'garden', label: 'Home', icon: Home },
    { id: 'collections', label: 'Collections', icon: Library },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 min-h-screen bg-[#faf8f3] border-r border-[#ece7dd] p-5 justify-between select-none">
        {/* Top: Brand & Navigation */}
        <div className="space-y-7">
          {/* Brand Header */}
          <div
            onClick={() => onTabChange('garden')}
            className="flex items-center gap-3 cursor-pointer group px-2 pt-1"
          >
            <div className="w-9 h-9 rounded-xl bg-[#e6ede7] flex items-center justify-center text-[#385440] group-hover:scale-105 transition-transform">
              <LeafLogoIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight text-[#253227] group-hover:text-[#385440] transition-colors leading-tight">
                The Thought<br />Garden
              </h1>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[#e7eee8] text-[#263b2c] shadow-xs font-semibold'
                      : 'text-[#5d695e] hover:text-[#253227] hover:bg-[#f1ece1]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#344f3b]' : 'text-[#7d8b7e]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Settings Item */}
            <button
              type="button"
              onClick={() => onTabChange('settings')}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all text-left ${
                activeTab === 'settings'
                  ? 'bg-[#e7eee8] text-[#263b2c] shadow-xs font-semibold'
                  : 'text-[#5d695e] hover:text-[#253227] hover:bg-[#f1ece1]'
              }`}
            >
              <SlidersHorizontal className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#344f3b]' : 'text-[#7d8b7e]'}`} />
              <span>Data & Settings</span>
            </button>

            {/* Learn & Explore Modal Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsLearnModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium text-[#657367] hover:text-[#263b2c] hover:bg-[#f1ece1] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4 text-[#8a998c]" />
                  <span>Learn & Explore</span>
                </div>
                <span className="text-[#96a497]">&rsaquo;</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Message / Botanical Quote */}
        <div className="pt-6 border-t border-[#eee9dc]">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f4efe5]/60 border border-[#e8e2d4]/70">
            <div className="w-6 h-6 shrink-0 rounded-full bg-[#e3ece4] flex items-center justify-center text-[#46654f] mt-0.5">
              <LeafLogoIcon className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-[#616e63] leading-relaxed">
              Small thoughts can grow into big things.
            </p>
          </div>
        </div>
      </aside>

      {/* Learn & Explore Modal */}
      {isLearnModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsLearnModalOpen(false)}
        >
          <div
            className="bg-[#fcfbf8] border border-[#e2dcce] rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#e8efe9] flex items-center justify-center text-[#4a6b53]">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#253227]">
                  The Thought Garden Philosophy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLearnModalOpen(false)}
                className="p-1 text-[#7c8779] hover:text-[#2d3a2e] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#4d5b4f] leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[#f2f7f3] border border-[#dbe7dc] space-y-1">
                <h4 className="font-semibold text-[#273c2d]">1. Capture First. Organize Later.</h4>
                <p className="text-xs text-[#526355]">
                  Thoughts don't need categories, titles, or tags right away. Plant them as raw fragments.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fdf2f2] border border-[#f4dede] space-y-1">
                <h4 className="font-semibold text-[#542d32]">2. Natural Growth</h4>
                <p className="text-xs text-[#634e51]">
                  Watch unfinished thoughts mature from Seeds into Sprouts, Blooms, and Mature reflections.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f4f3fa] border border-[#e3e1f3] space-y-1">
                <h4 className="font-semibold text-[#353154]">3. Gentle Rediscovery</h4>
                <p className="text-xs text-[#535166]">
                  No streaks, no pressure, and no guilt. The garden gently surfaces older insights when you're ready.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fdf6ee] border border-[#fae8d4] space-y-1">
                <h4 className="font-semibold text-[#543b23]">4. 100% Local & Private</h4>
                <p className="text-xs text-[#665646]">
                  Everything is saved in your browser's IndexedDB. Export your JSON backups anytime under Data & Settings.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLearnModalOpen(false)}
                className="px-5 py-2 bg-[#3f5f47] hover:bg-[#344f3b] text-white rounded-xl text-xs font-medium shadow-xs"
              >
                Return to Garden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
