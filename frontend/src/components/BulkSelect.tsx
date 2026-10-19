import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, CheckSquare, Trash2, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';

/**
 * Select-several-thoughts mode for a list. Only thoughts still on screen count as selected,
 * so changing a filter never removes something the person can't see.
 */
export function useThoughtSelection(visibleIds: string[]) {
  const { deleteThoughts } = useThoughts();
  const [isSelecting, setIsSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const selectedIds = useMemo(() => visibleIds.filter((id) => picked.has(id)), [visibleIds, picked]);
  const allSelected = visibleIds.length > 0 && selectedIds.length === visibleIds.length;

  const stop = useCallback(() => {
    setIsSelecting(false);
    setPicked(new Set());
    setIsConfirmOpen(false);
    setRemoveError(null);
  }, []);

  // Escape leaves select mode (the confirm dialog handles its own Escape first).
  useEffect(() => {
    if (!isSelecting || isConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && stop();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSelecting, isConfirmOpen, stop]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setPicked(allSelected ? new Set() : new Set(visibleIds));

  const remove = async () => {
    setIsRemoving(true);
    setRemoveError(null);
    try {
      await deleteThoughts(selectedIds);
      stop();
    } catch {
      // Whatever was removed is already gone from the list; the rest stay selected to try again.
      setRemoveError("Some thoughts couldn't be removed. Check your connection and try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    isSelecting,
    start: () => setIsSelecting(true),
    stop,
    isSelected: (id: string) => picked.has(id),
    toggle,
    toggleAll,
    allSelected,
    selectedIds,
    isConfirmOpen,
    openConfirm: () => {
      setRemoveError(null);
      setIsConfirmOpen(true);
    },
    closeConfirm: () => !isRemoving && setIsConfirmOpen(false),
    remove,
    isRemoving,
    removeError,
  };
}

export type ThoughtSelection = ReturnType<typeof useThoughtSelection>;

/** "Select" in a list header; becomes "Done" while selecting. */
export const SelectModeButton: React.FC<{ selection: ThoughtSelection; disabled?: boolean }> = ({ selection, disabled }) => (
  <button
    type="button"
    onClick={selection.isSelecting ? selection.stop : selection.start}
    disabled={disabled}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-garden-ink-soft bg-garden-card hover:bg-garden-card-hover border border-garden-line rounded-xl font-medium transition-colors disabled:opacity-50"
    aria-pressed={selection.isSelecting}
  >
    {selection.isSelecting ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
    <span>{selection.isSelecting ? 'Done' : 'Select'}</span>
  </button>
);

/** The round tick shown at the start of each row while selecting. */
export const SelectCheck: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span
    aria-hidden="true"
    className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
      checked ? 'bg-garden-moss border-garden-moss text-garden-paper' : 'bg-garden-card border-[#BFB38F]'
    }`}
  >
    {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
  </span>
);

/** Bar that stays at the bottom of the list while selecting, plus the "are you sure" dialog. */
export const SelectionBar: React.FC<{ selection: ThoughtSelection }> = ({ selection }) => {
  const count = selection.selectedIds.length;
  const label = `${count} ${count === 1 ? 'thought' : 'thoughts'}`;

  useEffect(() => {
    if (!selection.isConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && selection.closeConfirm();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection]);

  if (!selection.isSelecting) return null;

  return (
    <>
      <div
        role="toolbar"
        aria-label="Selected thoughts"
        className="sticky z-30 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-6 bg-[#FDFBF3] border border-[#CBD5AE] rounded-2xl shadow-lg px-3.5 py-3 flex items-center gap-3 animate-fade-in"
      >
        <span className="text-sm font-semibold text-garden-ink" aria-live="polite">
          {count === 0 ? 'Tap thoughts to select' : `${count} selected`}
        </span>
        <button
          type="button"
          onClick={selection.toggleAll}
          className="text-xs font-semibold text-garden-moss underline underline-offset-2 hover:text-garden-moss-dark"
        >
          {selection.allSelected ? 'Clear' : 'Select all'}
        </button>
        <button
          type="button"
          onClick={selection.openConfirm}
          disabled={count === 0}
          className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-garden-paper rounded-xl text-xs font-semibold disabled:opacity-40 disabled:hover:bg-rose-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
      </div>

      {selection.isConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-remove-title"
          className="modal-overlay z-50 bg-garden-ink/40 sm:backdrop-blur-xs animate-fade-in"
          onClick={selection.closeConfirm}
        >
          <div
            className="modal-panel w-full max-w-md bg-garden-card border border-garden-line rounded-3xl p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 id="bulk-remove-title" className="font-serif text-[26px] font-semibold text-garden-ink">
                Remove {label}?
              </h3>
            </div>
            <p className="text-sm text-garden-ink-soft leading-relaxed">
              {count === 1 ? 'It will be' : 'They will be'} removed from your garden and every collection. This can't
              be undone.
            </p>
            {selection.removeError && (
              <p role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {selection.removeError}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={selection.closeConfirm}
                disabled={selection.isRemoving}
                className="px-4 py-2 rounded-xl text-xs font-medium text-garden-ink-soft hover:bg-garden-line"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={selection.remove}
                disabled={selection.isRemoving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-garden-paper rounded-xl text-xs font-semibold disabled:opacity-60"
              >
                {selection.isRemoving ? 'Removing…' : `Remove ${label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
