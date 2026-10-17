import React, { useState } from 'react';
import { Home, Library, Search, Bookmark, SlidersHorizontal, Compass, X, BookOpen } from 'lucide-react';
import { NavTab } from '../types';
import { useThoughts } from '../context/StorageContext';
import { LeafLogoIcon } from './BotanicalIllustrations';
import { getDailyQuote } from '../lib/quotes';
import { ART } from '../lib/art';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { setIsFeedbackModalOpen } = useThoughts();
  const [isLearnModalOpen, setIsLearnModalOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'garden', label: 'Home', icon: Home },
    { id: 'thoughts', label: 'All Thoughts', icon: BookOpen },
    { id: 'collections', label: 'Collections', icon: Library },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto overflow-x-hidden bg-garden-sidebar/80 border-r border-garden-line select-none">
        <div className="relative z-10 px-5 pt-7 space-y-8">
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

          {/* Navigation */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {[...navItems, { id: 'settings' as NavTab, label: 'Data & Settings', icon: SlidersHorizontal }].map((item) => {
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

          {/* Learn & feedback */}
          <div className="space-y-1 border-t border-garden-line/80 pt-4">
            <button
              type="button"
              onClick={() => setIsLearnModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-1.5 rounded-xl text-sm text-garden-ink-soft hover:text-garden-ink hover:bg-garden-paper-deep/70 transition-colors"
            >
              <Compass className="w-4 h-4 text-garden-ink-faint" />
              <span>Learn &amp; Explore</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-1.5 rounded-xl text-sm text-garden-moss font-semibold hover:bg-garden-paper-deep/70 transition-colors"
            >
              <LeafLogoIcon className="w-4 h-4" />
              <span>Share pilot feedback</span>
            </button>
          </div>

          {/* Daily quote */}
          <figure className="px-3.5">
            <blockquote className="font-serif italic text-[16px] leading-snug text-garden-ink-soft">
              {getDailyQuote()}
            </blockquote>
          </figure>
        </div>

        {/* A tree planted at the bottom edge */}
        <div className="mt-auto pt-6 px-6 relative z-0 pointer-events-none flex justify-center" aria-hidden="true">
          <img src={ART.tree} alt="" className="w-44 max-h-[38vh] object-contain object-bottom -mb-1" />
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
                <h4 className="font-semibold text-[#543b23]">4. Safe in Your Account</h4>
                <p className="text-xs text-[#665646]">
                  Your garden is saved to your account, so it's there on any device you log in from. Export a JSON backup anytime under Data & Settings.
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
