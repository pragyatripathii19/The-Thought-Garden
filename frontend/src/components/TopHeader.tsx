import React, { useState } from 'react';
import { Search, X, Edit3, KeyRound, Trash2 } from 'lucide-react';
import { NavTab } from '../types';
import { useThoughts } from '../context/StorageContext';
import { LeafLogoIcon } from './BotanicalIllustrations';

interface TopHeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onTabChange }) => {
  const {
    thoughts,
    collections,
    userProfile,
    setIsFeedbackModalOpen,
    setIsOnboardingOpen,
    setIsAdminModalOpen,
  } = useThoughts();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Compute initials from user's actual name
  const getInitials = (name?: string) => {
    if (!name) return 'PT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(userProfile?.name);
  const displayName = userProfile?.name || 'Pragya Tripathi';

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
          {/* Feedback Button */}
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#edf5ee] hover:bg-[#e2ede4] text-[#34593e] border border-[#d5e6d8] rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            title="Share Feedback"
            aria-label="Share Feedback"
          >
            <span>🌱</span>
            <span className="text-[11px]">Feedback</span>
          </button>

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
            {initials}
          </button>
        </div>
      </header>

      {/* Desktop Top Header Bar (>= md) */}
      <header className="hidden md:flex items-center justify-end px-8 py-5 border-b border-[#eee9dc]/60 gap-3">
        {/* Feedback Button */}
        <button
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#edf5ee] hover:bg-[#e0ebe2] text-[#34593e] border border-[#d4e4d7] rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          title="Share Pilot Feedback"
        >
          <span>🌱</span>
          <span>Feedback</span>
        </button>

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
          title={`${displayName} (Profile)`}
          aria-label="User Profile"
        >
          {initials}
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
            className="bg-[#fcfbf8] border border-[#e2dcce] rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3d5a45] text-white flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#253227] leading-tight">
                    {displayName}
                  </h3>
                  <p className="text-[11px] text-[#788779]">
                    {userProfile?.email || 'Personal Pilot Garden'}
                  </p>
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

            {/* Reasons / Goals */}
            {userProfile?.reasons && userProfile.reasons.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#69786a]">
                  Garden Intent
                </span>
                <div className="flex flex-wrap gap-1">
                  {userProfile.reasons.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#edf5ee] text-[#34593e] border border-[#d5e7d8]"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsOnboardingOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-[#f4f1e8] hover:bg-[#ede8dc] text-[#334636] border border-[#e2dcd0] rounded-xl text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Goals</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsAdminModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-[#edf5ee] hover:bg-[#e2eee4] text-[#34593e] border border-[#d2e4d5] rounded-xl text-xs font-semibold transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Open Pilot Admin Panel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onTabChange('settings');
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-[#fff5f5] text-red-600 border border-[#f3dada] rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Reset Garden</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
