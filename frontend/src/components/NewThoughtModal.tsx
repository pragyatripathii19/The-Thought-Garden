import React, { useState, useEffect, useRef } from 'react';
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
  const { createThought } = useThoughts();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#faf8f4] border border-[#e3ded2] rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#eee9dc]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#5e6c5f] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 id="new-thought-title" className="font-serif text-xl font-medium text-[#253227]">
              New Thought
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7a877a] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capture Input Surface */}
        <div className="my-6 space-y-3">
          <div className="bg-white border border-[#e2dcd0] focus-within:border-[#7a9d83] focus-within:ring-2 focus-within:ring-[#e4ede6] rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between min-h-[220px]">
            <div className="space-y-2">
              <label
                htmlFor="new-thought-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[#69786a]"
              >
                What's on your mind?
              </label>
              <textarea
                id="new-thought-input"
                ref={textareaRef}
                rows={5}
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. an idea, a feeling to express, or perhaps a whim?"
                className="w-full bg-transparent text-[#253227] placeholder-[#9ca89d] text-base sm:text-lg resize-none focus:outline-none leading-relaxed"
              />
            </div>

            {/* Bottom Row inside card: Counter + Circular Plant Button */}
            <div className="flex items-center justify-between pt-3 border-t border-[#f4f0e6]">
              <span className="text-xs font-mono text-[#8f9d90]">
                {charCount}/1000
              </span>

              <div className="flex items-center gap-3">
                {justPlanted && (
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#344e3b] animate-fade-in pointer-events-none select-none"
                    aria-live="polite"
                  >
                    <SeedToSproutAnimation className="w-5 h-5 text-[#344e3b]" />
                    <span>Planted in garden</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handlePlant}
                  disabled={!text.trim() || isSaving || justPlanted}
                  className="w-10 h-10 rounded-full bg-[#344e3b] hover:bg-[#2b4131] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-transform active:scale-95 shadow-xs"
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
            <p className="font-serif text-base font-medium text-[#2d3a2e]">
              Just plant the thought.
            </p>
            <p className="text-xs text-[#6e7d70]">
              The garden will take care of the rest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
