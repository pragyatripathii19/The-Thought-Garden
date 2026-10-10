import React, { useState } from 'react';
import { Search, X, Shield, SlidersHorizontal } from 'lucide-react';
import { NavTab } from '../types';
import { useThoughts } from '../context/StorageContext';
import { LeafLogoIcon } from './BotanicalIllustrations';

interface TopHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onTabChange }) => {
  const { thoughts, collections } = useThoughts();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header (< md) */}
      <header className="md:hidden sticky top-0 z-30 bg-[#faf8f3]/95 backdrop-blur-md border-b border-[#ece7dd] px-4 py-3 flex items-center justify-between">
        <div
          onClick={() => onTabChange('garden')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-[#e6ede7] flex items-center justify-center text-[#385440]">
            <LeafLogoIcon className="w-4 h-4" />
          </div>
          <span className="font-serif text-lg font-bold text-[#253227] tracking-tight">
            The Thought Garden
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange('search')}
            className="p-2 text-[#5d695e] hover:text-[#253227] hover:bg-[#f1ece1] rounded-xl transition-colors"
            aria-label="Search Garden"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-[#3d5a45] text-white flex items-center justify-center text-xs font-semibold hover:bg-[#344f3b] transition-colors shadow-xs"
            aria-label="Open Profile"
          >
            PT
          </button>
        </div>
      </header>

      {/* Desktop Top Header Bar (>= md) */}
      <header className="hidden md:flex items-center justify-end px-8 py-5 border-b border-[#eee9dc]/60 gap-3">
        <button
          type="button"
          onClick={() => onTabChange('search')}
          className="p-2 text-[#5d695e] hover:text-[#253227] hover:bg-[#f1ece1] rounded-xl transition-colors"
          title="Search Thoughts (Q)"
          aria-label="Search Thoughts"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="w-9 h-9 rounded-full bg-[#3d5a45] text-white flex items-center justify-center text-xs font-semibold hover:bg-[#344f3b] transition-transform active:scale-95 shadow-xs"
          title="Pragya Tripathi (Profile)"
          aria-label="User Profile"
        >
          PT
        </button>
      </header>

      {/* User Profile Modal */}
      {isProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-[#fcfbf8] border border-[#e2dcce] rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3d5a45] text-white flex items-center justify-center text-xs font-semibold">
                  PT
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#253227] leading-tight">
                    Pragya Tripathi
                  </h3>
                  <p className="text-[11px] text-[#788779]">Personal Garden</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1 text-[#7c8779] hover:text-[#2d3a2e] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-[#f2f7f3] border border-[#dbe7dc] rounded-2xl">
                <div className="font-serif text-xl font-bold text-[#2d4734]">{thoughts.length}</div>
                <div className="text-[11px] text-[#556958]">Thoughts Planted</div>
              </div>
              <div className="p-3 bg-[#fbf2f2] border border-[#f4dede] rounded-2xl">
                <div className="font-serif text-xl font-bold text-[#5c3137]">{collections.length}</div>
                <div className="text-[11px] text-[#695254]">Collections</div>
              </div>
            </div>

            <div className="p-3 bg-[#f7f5ed] border border-[#e7e1d3] rounded-2xl text-xs text-[#59665b] space-y-1">
              <div className="flex items-center gap-2 font-medium text-[#273a2b]">
                <Shield className="w-4 h-4 text-[#4a6b53]" />
                <span>Local-First & Completely Private</span>
              </div>
              <p className="text-[11px] text-[#6a796c] leading-relaxed">
                Your thoughts live in your browser's IndexedDB. No server tracking or external databases.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onTabChange('settings');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ede9dd] hover:bg-[#e4decb] text-[#2d3c2e] rounded-xl text-xs font-medium transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Open Data & Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
