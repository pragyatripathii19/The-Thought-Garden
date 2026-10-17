import React, { useEffect, useState } from 'react';
import { Sprout, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useOrganizer } from '../context/OrganizerContext';
import { ReasonPicker } from './ReasonPicker';
import { joinReasons, splitReasons } from '../lib/profileReasons';

/** Edits the signed-in user's name and reasons, and offers Smart organising. */
export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, saveUserProfile, userProfile } = useThoughts();
  const { smartAvailable, settings, updateSettings } = useOrganizer();
  const [smartOptIn, setSmartOptIn] = useState(false);
  const [name, setName] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the saved profile each time the editor opens.
  useEffect(() => {
    if (!isOnboardingOpen) return;
    setName(userProfile?.name || '');
    const { ids, custom } = splitReasons(userProfile?.reasons);
    setSelectedReasons(ids);
    setCustomReason(custom);
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
      await saveUserProfile(name.trim(), joinReasons(selectedReasons, customReason));
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-garden-ink/50 backdrop-blur-xs animate-fade-in"
      onClick={close}
    >
      <div
        className="bg-[#FDFBF3] border border-garden-line rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-garden-ink-faint hover:text-garden-ink rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-garden-pill/60 border border-[#CBD5AE] text-garden-moss flex items-center justify-center mx-auto">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 id="profile-title" className="font-serif text-[32px] font-semibold text-garden-ink">
            Your profile
          </h2>
          {userProfile?.email && <p className="text-xs text-garden-ink-soft">Signed in as {userProfile.email}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft"
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
              className="w-full px-4 py-3 rounded-2xl bg-garden-card border border-garden-line text-garden-ink placeholder-garden-ink-faint text-sm focus:outline-none focus:border-garden-moss focus:ring-2 focus:ring-garden-pill/60 transition-all"
            />
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">
              Why are you growing a garden?
            </span>
            <ReasonPicker
              selected={selectedReasons}
              onChange={setSelectedReasons}
              custom={customReason}
              onCustomChange={setCustomReason}
            />
          </div>

          {/* Optional: Smart organising consent (only when the server supports it) */}
          {smartAvailable && !settings.smartOrganizing && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-garden-card border border-garden-line text-xs text-garden-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={smartOptIn}
                onChange={(e) => setSmartOptIn(e.target.checked)}
                className="mt-0.5 accent-garden-moss"
              />
              <span>
                <span className="font-semibold text-garden-ink">Turn on Smart organising (optional).</span>{' '}
                New thoughts, your collection names and why you’re here are sent through our server to an AI service
                to group them into collections. You can change this anytime in Settings.
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
              className="px-4 py-2.5 rounded-2xl text-sm font-medium text-garden-ink-soft hover:bg-garden-paper-deep"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-full bg-garden-moss hover:bg-garden-moss-dark disabled:opacity-40 disabled:cursor-not-allowed text-garden-paper font-medium text-sm shadow-md transition-all active:scale-[0.98]"
            >
              {isSubmitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
