import React, { useMemo, useState, useEffect, useRef } from 'react';
import { pickCapturePrompt } from '../lib/capturePrompts';
import { MAX_THOUGHT_LENGTH } from '../lib/defaults';
import { ArrowLeft, X, ArrowUpRight } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { SproutLeafClusterArt, SeedToSproutAnimation } from './BotanicalIllustrations';

interface NewThoughtModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCollectionId?: string;
}

export const NewThoughtModal: React.FC<NewThoughtModalProps> = ({
  isOpen,
  onClose,
  defaultCollectionId,
}) => {
  const { createThought, userProfile } = useThoughts();
  // A prompt that follows why they're here; a new one each time the dialog opens.
  const capturePrompt = useMemo(
    () => pickCapturePrompt(userProfile?.reasons, Math.floor(Math.random() * 1000)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, userProfile?.reasons]
  );
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justPlanted, setJustPlanted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setError(null);
      setJustPlanted(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePlant = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSaving) return;

    try {
      setIsSaving(true);
      setError(null);
      await createThought(trimmed, {
        collectionIds: defaultCollectionId ? [defaultCollectionId] : undefined,
      });
      setJustPlanted(true);
      setTimeout(() => {
        setText('');
        setJustPlanted(false);
        onClose();
      }, 950);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to plant thought');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePlant();
    }
  };

  if (!isOpen) return null;

  const charCount = text.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-thought-title"
      className="modal-overlay z-50 bg-garden-ink/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="modal-panel bg-[#FDFBF3] border border-garden-line rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-garden-line">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-garden-ink-soft hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 id="new-thought-title" className="font-serif text-[26px] font-semibold text-garden-ink">
              New Thought
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-garden-ink-faint hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capture Input Surface */}
        <div className="my-6 space-y-3">
          <div className="bg-garden-card border border-garden-line focus-within:border-[#BFB38F] focus-within:ring-2 focus-within:ring-garden-pill/60 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between min-h-[220px]">
            <div className="space-y-2">
              <label
                htmlFor="new-thought-input"
                className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft"
              >
                What's on your mind?
              </label>
              <textarea
                id="new-thought-input"
                ref={textareaRef}
                rows={5}
                value={text}
                maxLength={MAX_THOUGHT_LENGTH}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={capturePrompt}
                className="w-full bg-transparent text-garden-ink placeholder-garden-ink-faint text-base sm:text-lg resize-none focus:outline-none leading-relaxed"
              />
            </div>

            {/* Bottom Row inside card: Counter + Circular Plant Button */}
            <div className="flex items-center justify-between pt-3 border-t border-garden-line">
              <span className="text-xs font-mono text-garden-ink-faint">
                {charCount.toLocaleString()} / {MAX_THOUGHT_LENGTH.toLocaleString()}
              </span>

              <div className="flex items-center gap-3">
                {justPlanted && (
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold text-garden-moss animate-fade-in pointer-events-none select-none"
                    aria-live="polite"
                  >
                    <SeedToSproutAnimation className="w-5 h-5 text-garden-moss" />
                    <span>Planted in garden</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handlePlant}
                  disabled={!text.trim() || isSaving || justPlanted}
                  className="w-10 h-10 rounded-full bg-garden-moss hover:bg-garden-moss-dark disabled:opacity-40 disabled:cursor-not-allowed text-garden-paper flex items-center justify-center transition-transform active:scale-95"
                  title="Plant thought (Ctrl + Enter)"
                  aria-label="Plant thought"
                >
                  <ArrowUpRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
              {error}
            </p>
          )}
        </div>

        {/* Botanical Illustration & Zen Subtext */}
        <div className="text-center pt-2 pb-1 space-y-3 flex flex-col items-center">
          <SproutLeafClusterArt className="w-12 h-16 opacity-90" />
          <div className="space-y-0.5">
            <p className="font-serif text-xl font-semibold text-garden-ink">
              Just plant the thought.
            </p>
            <p className="text-xs text-garden-ink-soft">
              The garden will take care of the rest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
