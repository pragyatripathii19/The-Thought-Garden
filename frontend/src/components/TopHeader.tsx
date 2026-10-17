import React, { useState } from 'react';
import { X, Edit3, KeyRound, Settings, LogOut } from 'lucide-react';
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
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-garden-moss text-[#F4EEDB] flex items-center justify-center text-xs font-semibold hover:bg-garden-moss-dark transition-colors"
            aria-label="Open Profile"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Desktop Top Header Bar (>= md) */}
      <header className="hidden md:flex items-center justify-end gap-3 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-garden-ink/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-[#FDFBF3] border border-garden-line rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-garden-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-garden-moss text-garden-paper flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-garden-ink leading-tight">
                    {displayName}
                  </h3>
                  <p className="text-[11px] text-garden-ink-soft">
                    {userProfile?.email || 'Personal Pilot Garden'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1 text-garden-ink-faint hover:text-garden-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reasons / Goals */}
            {userProfile?.reasons && userProfile.reasons.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-garden-ink-soft">
                  Garden Intent
                </span>
                <div className="flex flex-wrap gap-1">
                  {userProfile.reasons.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-garden-pill/60 text-garden-moss border border-[#CBD5AE]"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-garden-paper-deep/70 border border-garden-line rounded-2xl">
                <div className="font-serif text-[26px] font-semibold text-garden-ink">{thoughts.length}</div>
                <div className="text-[11px] text-garden-ink-soft">Thoughts Planted</div>
              </div>
              <div className="p-3 bg-garden-paper-deep/70 border border-garden-line rounded-2xl">
                <div className="font-serif text-[26px] font-semibold text-garden-ink">{collections.length}</div>
                <div className="text-[11px] text-garden-ink-soft">Collections</div>
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
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-garden-paper-deep hover:bg-garden-line text-garden-ink border border-garden-line rounded-xl text-xs font-semibold transition-colors"
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
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-garden-pill/60 hover:bg-garden-pill/60 text-garden-moss border border-[#CBD5AE] rounded-xl text-xs font-semibold transition-colors"
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
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-garden-card hover:bg-garden-paper-deep text-garden-ink border border-garden-line rounded-xl text-xs font-semibold transition-colors"
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
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-garden-card hover:bg-garden-paper-deep text-garden-ink border border-garden-line rounded-xl text-xs font-semibold transition-colors"
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
