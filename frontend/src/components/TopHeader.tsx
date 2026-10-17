import React, { useState } from 'react';
import { Search, X, Edit3, KeyRound, Settings, LogOut } from 'lucide-react';
import { NavTab } from '../types';
import { useThoughts } from '../context/StorageContext';
import { useAuth } from '../context/AuthContext';
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
    isAdmin,
  } = useThoughts();
  const { logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Compute initials from user's actual name
  const getInitials = (name?: string) => {
    if (!name) return 'G';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(userProfile?.name);
  const displayName = userProfile?.name || 'Gardener';

  return (
    <>
      {/* Mobile Top Header (< md) */}
      <header className="md:hidden sticky top-0 z-30 bg-garden-paper/90 backdrop-blur-md border-b border-garden-line px-4 py-3 flex items-center justify-between">
        <div
          onClick={() => onTabChange('garden')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <LeafLogoIcon className="w-5 h-5 text-garden-moss -rotate-12" />
          <span className="font-serif text-[21px] font-semibold text-garden-ink tracking-tight leading-none whitespace-nowrap">
            The Thought Garden
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Feedback Button */}
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold text-garden-moss hover:bg-garden-paper-deep transition-colors"
            title="Share Feedback"
            aria-label="Share Feedback"
          >
            <LeafLogoIcon className="w-3.5 h-3.5" />
            <span className="hidden min-[400px]:inline">Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('search')}
            className="p-2 text-garden-ink-soft hover:text-garden-ink hover:bg-garden-paper-deep rounded-full transition-colors"
            aria-label="Search Garden"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-garden-moss text-[#F4EEDB] flex items-center justify-center text-xs font-semibold hover:bg-garden-moss-dark transition-colors"
            aria-label="Open Profile"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Desktop Top Header Bar (>= md) */}
      <header className="hidden md:flex items-center gap-3 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Search: looks like a field, opens the Search page */}
        <button
          type="button"
          onClick={() => onTabChange('search')}
          className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-garden-card/80 border border-garden-line text-sm text-garden-ink-faint hover:border-[#CFC39F] hover:text-garden-ink-soft transition-colors text-left"
          title="Search Thoughts"
          aria-label="Search thoughts or collections"
        >
          <Search className="w-4 h-4" />
          <span>Search thoughts or collections…</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFeedbackModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-garden-moss hover:bg-garden-paper-deep transition-colors"
          title="Share Pilot Feedback"
        >
          <LeafLogoIcon className="w-4 h-4" />
          <span>Feedback</span>
        </button>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="w-10 h-10 rounded-full bg-garden-moss text-[#F4EEDB] flex items-center justify-center text-sm font-semibold hover:bg-garden-moss-dark transition-transform active:scale-95"
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

              {isAdmin && (
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
              )}

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onTabChange('settings');
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] text-[#334636] border border-[#e2dcd0] rounded-xl text-xs font-semibold transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Account &amp; Data Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] text-[#334636] border border-[#e2dcd0] rounded-xl text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
