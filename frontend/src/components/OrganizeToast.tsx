import React, { useEffect, useState } from 'react';
import { Leaf, Undo2, X } from 'lucide-react';
import { useOrganizer } from '../context/OrganizerContext';

const AUTO_HIDE_MS = 9000;

/**
 * Quiet notice shown whenever the organiser changes something, with Undo.
 * Keeps automatic organising visible and reversible.
 */
export const OrganizeToast: React.FC = () => {
  const { notice, dismissNotice, undoEvents } = useOrganizer();
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismissNotice, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  const handleUndo = async () => {
    try {
      setIsUndoing(true);
      await undoEvents(notice.events.map((e) => e.id));
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-40 left-4 right-4 bottom-24 md:left-auto md:right-6 md:bottom-6 md:max-w-sm bg-[#FDFBF3] border border-[#CBD5AE] rounded-2xl shadow-lg p-3.5 flex items-start gap-3"
    >
      <div className="w-7 h-7 rounded-full bg-garden-pill/60 text-garden-moss flex items-center justify-center shrink-0">
        <Leaf className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-garden-ink">Organised automatically</p>
        <p className="text-xs text-garden-ink-soft mt-0.5 leading-relaxed">{notice.message}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={handleUndo}
          disabled={isUndoing}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-garden-moss bg-garden-pill/60 hover:bg-garden-pill/60 border border-[#CBD5AE] disabled:opacity-50 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>{isUndoing ? 'Undoing…' : 'Undo'}</span>
        </button>
        <button
          type="button"
          onClick={dismissNotice}
          className="p-1.5 text-garden-ink-faint hover:text-garden-ink rounded-lg"
          aria-label="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/** Small "Auto" pill marking things the organiser did. */
export const AutoBadge: React.FC<{ title?: string; className?: string }> = ({ title, className = '' }) => (
  <span
    title={title || 'Organised automatically — you can undo or change this anytime'}
    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-garden-pill/70 text-garden-moss border border-[#CBD5AE] ${className}`}
  >
    <Leaf className="w-2.5 h-2.5" />
    Auto
  </span>
);
