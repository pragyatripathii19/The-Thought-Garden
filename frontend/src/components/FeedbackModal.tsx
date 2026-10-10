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

  if (!isFeedbackModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await submitFeedback(category, rating, message.trim(), email.trim() || undefined);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setMessage('');
        setIsFeedbackModalOpen(false);
      }, 1400);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/50 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsFeedbackModalOpen(false)}
    >
      <div
        className="bg-[#faf8f4] border border-[#e3ded2] rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#edf5ee] border border-[#d5e7d8] flex items-center justify-center text-[#3d5a45]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 id="feedback-title" className="font-serif text-lg font-semibold text-[#233126]">
                Share Pilot Feedback
              </h2>
              <p className="text-[11px] text-[#6e7d70]">
                Help us refine and grow The Thought Garden
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(false)}
            className="p-1.5 text-[#7a877a] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#edf5ee] border border-[#d2e4d5] text-[#3d5a45] flex items-center justify-center mx-auto">
              <SeedToSproutAnimation className="w-7 h-7 text-[#3d5a45]" />
            </div>
            <h3 className="font-serif text-lg font-medium text-[#233126]">
              Thank you, {userProfile?.name || 'Gardener'}!
            </h3>
            <p className="text-xs text-[#6e7d70] max-w-xs mx-auto">
              Your feedback has been planted in our garden notes and will help shape upcoming updates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526354]">
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
                          ? 'bg-[#3d5a45] text-white border-[#3d5a45] shadow-xs'
                          : 'bg-white text-[#566858] border-[#e2dcd0] hover:border-[#ccd7ce]'
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#526354]">
                How is your garden experience?
              </label>
              <div className="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-[#e2dcd0]">
                {RATING_LEVELS.map((lvl) => {
                  const isSelected = rating === lvl.val;
                  return (
                    <button
                      key={lvl.val}
                      type="button"
                      onClick={() => setRating(lvl.val)}
                      className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-[#edf5ee] text-[#2b4d32] font-semibold scale-105 shadow-xs'
                          : 'text-[#879689] hover:text-[#455c48]'
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
                className="block text-xs font-semibold uppercase tracking-wider text-[#526354]"
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
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#ded8cb] text-[#233126] placeholder-[#9ca89d] text-xs sm:text-sm focus:outline-hidden focus:border-[#4a6b53] focus:ring-2 focus:ring-[#e2ede4] transition-all resize-none shadow-xs"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1">
              <label htmlFor="feedback-email" className="block text-[11px] text-[#738475]">
                Email (optional, if you'd like a response)
              </label>
              <input
                id="feedback-email"
                type="email"
                placeholder={userProfile?.email || 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#ded8cb] text-[#233126] placeholder-[#9ca89d] text-xs focus:outline-hidden focus:border-[#4a6b53] focus:ring-2 focus:ring-[#e2ede4] transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-[#344e3b] hover:bg-[#283e2e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.98]"
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
