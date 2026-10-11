import React, { useState } from 'react';
import { Sprout, Check, ArrowRight } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useOrganizer } from '../context/OrganizerContext';
import { SeedToSproutAnimation } from './BotanicalIllustrations';

const REASON_OPTIONS = [
  { id: 'brain-dump', label: '🌱 Daily Brain Dump', desc: 'Clear mental clutter' },
  { id: 'startup-ideas', label: '💡 Startup & Project Ideas', desc: 'Nurture creative concepts' },
  { id: 'writing', label: '✍️ Writing & Journaling', desc: 'Draft essays & thoughts' },
  { id: 'research', label: '📚 Study & Deep Research', desc: 'Collect knowledge & links' },
  { id: 'tasks', label: '📋 Tasks & Follow-ups', desc: 'Keep track of actionable notes' },
  { id: 'mindfulness', label: '✨ Mindful Reflection', desc: 'Zen thinking space' },
];

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, saveUserProfile } = useThoughts();
  const { smartAvailable, settings, updateSettings } = useOrganizer();
  const [smartOptIn, setSmartOptIn] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOnboardingOpen) return null;

  const toggleReason = (reasonLabel: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonLabel)
        ? prev.filter((r) => r !== reasonLabel)
        : [...prev, reasonLabel]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await saveUserProfile(
        name.trim(),
        selectedReasons.length > 0 ? selectedReasons : ['Daily Brain Dump'],
        email.trim() || undefined
      );
      if (smartOptIn && !settings.smartOrganizing) {
        updateSettings({ smartOrganizing: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-[#faf8f4] border border-[#e3ded2] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Header with botanical emblem */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#edf5ee] border border-[#d2e5d5] text-[#3d5a45] flex items-center justify-center mx-auto shadow-xs">
            <Sprout className="w-6 h-6 animate-breeze-sprout" />
          </div>
          <h2 id="onboarding-title" className="font-serif text-2xl sm:text-3xl font-bold text-[#233126]">
            Welcome to The Thought Garden
          </h2>
          <p className="text-xs sm:text-sm text-[#6e7d70]">
            Every thought has a home. Let's personalize your private garden.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="pilot-user-name"
              className="block text-xs font-semibold uppercase tracking-wider text-[#526354]"
            >
              What should we call you? *
            </label>
            <input
              id="pilot-user-name"
              type="text"
              required
              autoFocus
              placeholder="e.g. Pragya, Alex, or your preferred name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#ded8cb] text-[#233126] placeholder-[#9ca89d] text-sm focus:outline-hidden focus:border-[#4a6b53] focus:ring-2 focus:ring-[#e2ede4] transition-all shadow-xs"
            />
          </div>

          {/* Step 2: Reason for Using */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#526354]">
              Why are you growing a garden today?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASON_OPTIONS.map((opt) => {
                const isSelected = selectedReasons.includes(opt.label);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleReason(opt.label)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left border text-xs transition-all ${
                      isSelected
                        ? 'bg-[#edf5ee] border-[#a5caa9] text-[#253e2a] font-medium shadow-xs'
                        : 'bg-white border-[#e6e1d5] text-[#556557] hover:border-[#ccd7ce]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-[#3d5a45] text-white border-[#3d5a45]'
                          : 'border-[#c8c2b5] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-[#78887a]">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Optional Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="pilot-user-email"
              className="block text-xs font-medium text-[#738475]"
            >
              Email (optional, for pilot feedback & updates)
            </label>
            <input
              id="pilot-user-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#ded8cb] text-[#233126] placeholder-[#9ca89d] text-xs focus:outline-hidden focus:border-[#4a6b53] focus:ring-2 focus:ring-[#e2ede4] transition-all"
            />
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

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#344e3b] hover:bg-[#283e2e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <SeedToSproutAnimation className="w-5 h-5 text-white" />
                  <span>Preparing your garden…</span>
                </>
              ) : (
                <>
                  <span>Enter The Thought Garden</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
