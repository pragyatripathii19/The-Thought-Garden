import React, { useEffect, useState } from 'react';
import { Sprout, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useOrganizer } from '../context/OrganizerContext';
import { ReasonPicker } from './ReasonPicker';

/** Edits the signed-in user's name and reasons, and offers Smart organising. */
export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, saveUserProfile, userProfile } = useThoughts();
  const { smartAvailable, settings, updateSettings } = useOrganizer();
  const [smartOptIn, setSmartOptIn] = useState(false);
  const [name, setName] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the saved profile each time the editor opens.
  useEffect(() => {
    if (!isOnboardingOpen) return;
    setName(userProfile?.name || '');
    setSelectedReasons(userProfile?.reasons || []);
    setSmartOptIn(false);
    setError(null);
  }, [isOnboardingOpen, userProfile]);

  if (!isOnboardingOpen) return null;

  const close = () => {
    if (!isSubmitting) setIsOnboardingOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await saveUserProfile(name.trim(), selectedReasons);
      if (smartOptIn && !settings.smartOrganizing) {
        updateSettings({ smartOrganizing: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your profile couldn't be saved. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/50 backdrop-blur-xs animate-fade-in"
      onClick={close}
    >
      <div
        className="bg-[#faf8f4] border border-[#e3ded2] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-[#7c8779] hover:text-[#2d3a2e] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#edf5ee] border border-[#d2e5d5] text-[#3d5a45] flex items-center justify-center mx-auto shadow-xs">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 id="profile-title" className="font-serif text-2xl font-bold text-[#233126]">
            Your profile
          </h2>
          {userProfile?.email && <p className="text-xs text-[#6e7d70]">Signed in as {userProfile.email}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold uppercase tracking-wider text-[#526354]"
            >
              What should we call you?
            </label>
            <input
              id="profile-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#ded8cb] text-[#233126] placeholder-[#9ca89d] text-sm focus:outline-none focus:border-[#4a6b53] focus:ring-2 focus:ring-[#e2ede4] transition-all shadow-xs"
            />
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#526354]">
              Why are you growing a garden?
            </span>
            <ReasonPicker selected={selectedReasons} onChange={setSelectedReasons} />
          </div>

          {/* Optional: Smart organising consent (only when the server supports it) */}
          {smartAvailable && !settings.smartOrganizing && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#e6e1d5] text-xs text-[#556557] cursor-pointer">
              <input
                type="checkbox"
                checked={smartOptIn}
                onChange={(e) => setSmartOptIn(e.target.checked)}
                className="mt-0.5 accent-[#3d5a45]"
              />
              <span>
                <span className="font-semibold text-[#253e2a]">Turn on Smart organising (optional).</span>{' '}
                New thoughts and your collection names are sent through our server to an AI service to group them
                into collections. You can change this anytime in Data &amp; Settings.
              </span>
            </label>
          )}

          {error && (
            <p role="alert" className="text-xs text-[#7a2e2e] bg-[#fff1f1] border border-[#f1c9c9] rounded-2xl p-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={close}
              className="px-4 py-2.5 rounded-2xl text-sm font-medium text-[#546255] hover:bg-[#f3f0e8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-[#344e3b] hover:bg-[#283e2e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm shadow-md transition-all active:scale-[0.98]"
            >
              {isSubmitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
