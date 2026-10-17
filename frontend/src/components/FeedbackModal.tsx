import React, { useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { PilotFeedbackCategory } from '../types';
import { SeedToSproutAnimation } from './BotanicalIllustrations';

const CATEGORIES: { id: PilotFeedbackCategory; label: string; icon: string }[] = [
  { id: 'suggestion', label: 'Idea / Suggestion', icon: '💡' },
  { id: 'bug', label: 'Bug / Issue', icon: '🐛' },
  { id: 'praise', label: 'Loving It', icon: '❤️' },
  { id: 'other', label: 'Confused / Question', icon: '❓' },
];

const RATING_LEVELS = [
  { val: 1, label: 'Sprouting' },
  { val: 2, label: 'Growing' },
  { val: 3, label: 'Budding' },
  { val: 4, label: 'Blooming' },
  { val: 5, label: 'Thriving' },
];

export const FeedbackModal: React.FC = () => {
  const { isFeedbackModalOpen, setIsFeedbackModalOpen, submitFeedback, userProfile } = useThoughts();
  const [category, setCategory] = useState<PilotFeedbackCategory>('suggestion');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isFeedbackModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await submitFeedback(category, rating, message.trim(), email.trim() || undefined);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        setIsFeedbackModalOpen(false);
      }, 1400);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Your feedback couldn't be sent. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-garden-ink/50 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsFeedbackModalOpen(false)}
    >
      <div
        className="bg-[#FDFBF3] border border-garden-line rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-garden-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-garden-pill/60 border border-[#CBD5AE] flex items-center justify-center text-garden-moss">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 id="feedback-title" className="font-serif text-2xl font-semibold text-garden-ink">
                Share Pilot Feedback
              </h2>
              <p className="text-[11px] text-garden-ink-soft">
                Help us refine and grow The Thought Garden
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(false)}
            className="p-1.5 text-garden-ink-faint hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-garden-pill/60 border border-[#CBD5AE] text-garden-moss flex items-center justify-center mx-auto">
              <SeedToSproutAnimation className="w-7 h-7 text-garden-moss" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-garden-ink">
              Thank you, {userProfile?.name || 'Gardener'}!
            </h3>
            <p className="text-xs text-garden-ink-soft max-w-xs mx-auto">
              Your feedback has been planted in our garden notes and will help shape upcoming updates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">
                Feedback Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? 'bg-garden-moss text-garden-paper border-garden-moss'
                          : 'bg-garden-card text-garden-ink-soft border-garden-line hover:border-[#D6CAA6]'
                      }`}
                    >
                      <span className="mr-1">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Rating (1-5 leaves) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">
                How is your garden experience?
              </label>
              <div className="flex items-center justify-between p-2.5 bg-garden-card rounded-2xl border border-garden-line">
                {RATING_LEVELS.map((lvl) => {
                  const isSelected = rating === lvl.val;
                  return (
                    <button
                      key={lvl.val}
                      type="button"
                      onClick={() => setRating(lvl.val)}
                      className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-garden-pill/60 text-garden-moss font-semibold scale-105'
                          : 'text-garden-ink-faint hover:text-garden-ink-soft'
                      }`}
                    >
                      <span className="text-lg">🌿</span>
                      <span className="text-[10px]">{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <label
                htmlFor="feedback-message"
                className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft"
              >
                What's on your mind? *
              </label>
              <textarea
                id="feedback-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What felt great? Was anything confusing, slow, or missing?"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-garden-card border border-garden-line text-garden-ink placeholder-garden-ink-faint text-xs sm:text-sm focus:outline-none focus:border-garden-moss focus:ring-2 focus:ring-garden-pill/60 transition-all resize-none"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <label htmlFor="feedback-email" className="block text-[11px] text-garden-ink-soft">
                Email (optional, if you'd like a response)
              </label>
              <input
                id="feedback-email"
                type="email"
                placeholder={userProfile?.email || 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-garden-card border border-garden-line text-garden-ink placeholder-garden-ink-faint text-xs focus:outline-none focus:border-garden-moss focus:ring-2 focus:ring-garden-pill/60 transition-all"
              />
            </div>

            {submitError && (
              <p role="alert" className="text-xs text-[#7a2e2e] bg-[#fff1f1] border border-[#f1c9c9] rounded-2xl p-3">
                {submitError}
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="w-full py-3 px-4 rounded-full bg-garden-moss hover:bg-garden-moss-dark disabled:opacity-40 disabled:cursor-not-allowed text-garden-paper font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span>Sending feedback…</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
