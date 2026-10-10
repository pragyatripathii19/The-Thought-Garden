import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Edit3, Trash2, Check, AlertCircle } from 'lucide-react';
import { Thought, GrowthStage } from '../types';
import { GrowthStageBadge, stageConfig } from './GrowthStageBadge';

interface ThoughtDetailModalProps {
  thought: Thought | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: { text?: string; stage?: GrowthStage }) => Promise<Thought>;
  onDelete: (id: string) => Promise<void>;
}

export const ThoughtDetailModal: React.FC<ThoughtDetailModalProps> = ({
  thought,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (thought) {
      setEditText(thought.text);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [thought]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          setIsEditing(false);
          setEditText(thought?.text || '');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, showDeleteConfirm, thought, onClose]);

  if (!isOpen || !thought) return null;

  const handleSaveText = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === thought.text) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(thought.id, { text: trimmed });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update thought text:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStageSelect = async (newStage: GrowthStage) => {
    if (newStage === (thought.stage || 'seed')) return;
    try {
      await onUpdate(thought.id, { stage: newStage });
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(thought.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete thought:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFullDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isTended = new Date(thought.updatedAt).getTime() - new Date(thought.createdAt).getTime() > 2000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-900/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white border border-parchment-border rounded-3xl shadow-soft-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-parchment-border/70 flex items-center justify-between bg-parchment-light">
          <div className="flex items-center gap-2">
            <GrowthStageBadge stage={thought.stage || 'seed'} size="md" />
            <span className="text-xs text-stone-400">Thought Details</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-earth-900 hover:bg-parchment-soft transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Thought Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold text-stone-400 tracking-wider">
                Verbatim Thought
              </span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-sage-600 hover:text-sage-700 font-medium transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit words</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  disabled={isSaving}
                  placeholder="Thought cannot be empty..."
                  className="w-full p-4 bg-parchment-soft/50 rounded-2xl border border-sage-300 focus:border-sage-500 focus:ring-2 focus:ring-sage-200 text-earth-900 text-base leading-relaxed resize-none transition-all"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(thought.text);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:bg-parchment-soft transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveText}
                    disabled={!editText.trim() || isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-parchment-soft/40 border border-parchment-border/60">
                <p className="text-earth-900 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-sans">
                  {thought.text}
                </p>
              </div>
            )}
          </div>

          {/* Growth Stage Selector */}
          <div>
            <label className="block text-xs uppercase font-semibold text-stone-400 tracking-wider mb-2.5">
              Growth Stage
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(stageConfig) as GrowthStage[]).map((stageKey) => {
                const config = stageConfig[stageKey];
                const Icon = config.icon;
                const isSelected = (thought.stage || 'seed') === stageKey;
                return (
                  <button
                    key={stageKey}
                    type="button"
                    onClick={() => handleStageSelect(stageKey)}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all text-xs ${
                      isSelected
                        ? 'border-sage-600 bg-sage-50/80 shadow-soft font-semibold text-sage-800 ring-1 ring-sage-500'
                        : 'border-parchment-border hover:border-stone-300 bg-white hover:bg-parchment-soft/50 text-stone-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-sage-600' : config.iconColor}`} />
                    <span className="capitalize">{config.label}</span>
                    <span className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{config.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-2 border-t border-parchment-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <span>Planted: {formatFullDate(thought.createdAt)}</span>
            </div>
            {isTended && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400 flex-shrink-0" />
                <span>Last tended: {formatFullDate(thought.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Safe Deletion */}
        <div className="px-6 py-4 border-t border-parchment-border/70 bg-parchment-light/60 flex items-center justify-between">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between w-full gap-3 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>Remove thought from garden?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-parchment-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-soft transition-all"
                >
                  {isDeleting ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove thought</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-parchment-soft border border-parchment-border text-earth-800 rounded-xl text-xs font-medium shadow-soft transition-all"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
