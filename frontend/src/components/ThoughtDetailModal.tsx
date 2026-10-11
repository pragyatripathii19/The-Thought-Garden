import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MoreHorizontal,
  Bookmark,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  Search,
  PenTool,
  CheckSquare,
  Sprout,
  Sparkles,
  Link2,
  Plus,
  X,
} from 'lucide-react';
import { Thought, GrowthStage } from '../types';
import { GrowthStageBadge, stageConfig } from './GrowthStageBadge';
import { useThoughts } from '../context/StorageContext';
import { formatRelativeTime } from '../lib/time';
import { AutoBadge } from './OrganizeToast';

interface ThoughtDetailModalProps {
  thought: Thought | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    updates: {
      text?: string;
      stage?: GrowthStage;
      collectionIds?: string[];
      isSaved?: boolean;
    }
  ) => Promise<Thought>;
  onDelete: (id: string) => Promise<void>;
  onSelectThought?: (thought: Thought) => void;
}

export const ThoughtDetailModal: React.FC<ThoughtDetailModalProps> = ({
  thought,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onSelectThought,
}) => {
  const { collections, toggleSaveThought, connections, thoughts, toggleThoughtCollection } = useThoughts();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  useEffect(() => {
    if (thought) {
      setEditText(thought.text);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setShowOptions(false);
      setIsAddingCollection(false);
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

  // Find accepted connected thoughts
  const activeConnections = connections.filter(
    (c) =>
      c.status === 'accepted' &&
      (c.sourceThoughtId === thought.id || c.targetThoughtId === thought.id)
  );

  const connectedThoughts = activeConnections.map((c) => {
    const otherId = c.sourceThoughtId === thought.id ? c.targetThoughtId : c.sourceThoughtId;
    const otherThought = thoughts.find((t) => t.id === otherId);
    return {
      connection: c,
      thought: otherThought,
    };
  }).filter((item): item is { connection: typeof item.connection; thought: Thought } => Boolean(item.thought));

  const primaryConnectionReason = activeConnections[0]?.reason || null;

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

  const handleToggleSave = async () => {
    try {
      await toggleSaveThought(thought.id);
    } catch (err) {
      console.error(err);
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

  const getThoughtIcon = (t: Thought) => {
    if (t.category === 'research' || t.collectionIds.includes('col-things-to-research')) {
      return { Icon: Search, bg: 'bg-[#e7e4f6] text-[#4f4886]' };
    }
    if (t.category === 'writing' || t.collectionIds.includes('col-writing')) {
      return { Icon: PenTool, bg: 'bg-[#fae2e3] text-[#8c3b42]' };
    }
    if (t.category === 'task' || t.collectionIds.includes('col-tasks-to-revisit')) {
      return { Icon: CheckSquare, bg: 'bg-[#fae8d4] text-[#855320]' };
    }
    return { Icon: Sprout, bg: 'bg-[#dcebdd] text-[#34593e]' };
  };

  const getCollectionName = (collectionIds: string[]) => {
    const col = collections.find((c) => collectionIds.includes(c.id));
    return col ? col.name : 'Garden';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#faf8f4] border border-[#e4ded0] rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar matching reference: <- on left, ... on right */}
        <div className="px-6 py-4 border-b border-[#eee9dc] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5e6c5f] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-1.5 rounded-xl transition-colors ${
                thought.isSaved
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                  : 'text-[#7c8779] hover:text-[#253227] hover:bg-[#ede8dc]'
              }`}
              title={thought.isSaved ? 'Saved thought' : 'Save thought'}
              aria-label="Bookmark thought"
            >
              <Bookmark className={`w-5 h-5 ${thought.isSaved ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="p-1.5 text-[#7c8779] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
              aria-label="Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showOptions && (
              <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-[#e4ded0] rounded-2xl shadow-lg p-1.5 animate-fade-in text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[#253227] hover:bg-[#f2efe6] rounded-xl transition-colors text-left"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Words</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove Thought</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* Badge: Connection (only if category is 'connection') or just Stage */}
          <div className="flex items-center gap-2">
            {thought.category === 'connection' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#eef4fb] text-[#36618c] border border-[#d4e4f5]">
                <Link2 className="w-3.5 h-3.5" />
                <span>Connection</span>
              </span>
            )}
            <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
          </div>

          {/* Thought Headline Typography */}
          <div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  disabled={isSaving}
                  placeholder="Thought cannot be empty..."
                  className="w-full p-4 bg-white rounded-2xl border border-[#7a9d83] text-[#253227] text-base leading-relaxed resize-none focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(thought.text);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#6e7d70] hover:bg-[#ede9df]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveText}
                    disabled={!editText.trim() || isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3d5a45] hover:bg-[#344e3b] text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#233126] leading-relaxed tracking-tight">
                {thought.text}
              </h2>
            )}

            {/* Timestamp & Pin Tag */}
            <div className="flex items-center gap-2 text-xs text-[#819283] mt-2">
              <span>{formatRelativeTime(thought.createdAt)}</span>
              <span>•</span>
              <button
                type="button"
                onClick={handleToggleSave}
                className="hover:text-[#253227] inline-flex items-center gap-1"
              >
                <span>📌</span>
                <span>{thought.isSaved ? 'Saved' : 'Pin thought'}</span>
              </button>
            </div>
          </div>

          {/* Related Thoughts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-[#233126]">
                Related Thoughts
              </h3>
              {connectedThoughts.length > 0 && (
                <span className="text-xs text-[#718273]">
                  {connectedThoughts.length} linked
                </span>
              )}
            </div>

            {connectedThoughts.length === 0 ? (
              <p className="text-xs text-[#7b897c] p-3.5 bg-white rounded-2xl border border-[#e4ded0]">
                No accepted connections yet. As more thoughts accumulate, the connection discovery engine will suggest related ideas here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {connectedThoughts.map(({ thought: related }) => {
                  const iconMeta = getThoughtIcon(related);
                  const Icon = iconMeta.Icon;
                  const colName = getCollectionName(related.collectionIds);

                  return (
                    <div
                      key={related.id}
                      onClick={() => onSelectThought && onSelectThought(related)}
                      className="p-3.5 bg-white hover:bg-[#fcfbf9] border border-[#e4ded0] hover:border-[#b8caa0] rounded-2xl cursor-pointer transition-all flex items-start gap-3 shadow-xs"
                    >
                      <div className={`w-8 h-8 rounded-full ${iconMeta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-[#233126] leading-relaxed line-clamp-2">
                          {related.text}
                        </p>
                        <div className="text-[11px] text-[#869688] mt-1 flex items-center gap-1.5">
                          <span>{formatRelativeTime(related.createdAt)}</span>
                          <span>•</span>
                          <span>{colName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* "A possible connection" Section */}
          {primaryConnectionReason && (
            <div className="p-4 rounded-2xl bg-[#f0f5fc] border border-[#d6e4f5] space-y-1.5">
              <div className="flex items-center gap-2 text-[#355f8a]">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-serif text-sm font-semibold">
                  A possible connection
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#3e5f82] leading-relaxed">
                {primaryConnectionReason}
              </p>
            </div>
          )}

          {/* Collections Section */}
          <div className="pt-2 border-t border-[#eee9dc]">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#738274]">
                Collections
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCollection(!isAddingCollection)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#3d5a45] hover:text-[#283e2e] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to collection</span>
              </button>
            </div>

            {/* Current collection badges */}
            <div className="flex flex-wrap items-center gap-2">
              {thought.collectionIds && thought.collectionIds.length > 0 ? (
                thought.collectionIds.map((cid) => {
                  const col = collections.find((c) => c.id === cid);
                  if (!col) return null;
                  return (
                    <span
                      key={cid}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#f2ede4] text-[#2c3d2e] border border-[#e4ded0]"
                    >
                      <span>{col.name}</span>
                      {thought.autoCollectionIds?.includes(cid) && (
                        <AutoBadge title="Added automatically — remove it with × if it doesn't fit" />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleThoughtCollection(thought.id, cid)}
                        className="p-0.5 hover:bg-[#e4ded0] rounded-full text-[#738274] hover:text-[#233126] transition-colors"
                        title={`Remove from ${col.name}`}
                        aria-label={`Remove from ${col.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-[#879688] italic">
                  Not assigned to any collections yet
                </span>
              )}
            </div>

            {/* Dropdown to add unassigned collections */}
            {isAddingCollection && (
              <div className="mt-2.5 p-2 bg-white border border-[#e4ded0] rounded-2xl shadow-sm space-y-1 animate-fade-in">
                <div className="text-[11px] font-semibold text-[#738274] px-2 py-0.5">
                  Choose a collection:
                </div>
                {collections.filter((c) => !thought.collectionIds?.includes(c.id)).length > 0 ? (
                  collections
                    .filter((c) => !thought.collectionIds?.includes(c.id))
                    .map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={async () => {
                          await toggleThoughtCollection(thought.id, col.id);
                          setIsAddingCollection(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-[#233126] hover:bg-[#f3f0e8] rounded-xl text-left transition-colors"
                      >
                        <span className="font-medium">{col.name}</span>
                        <Plus className="w-3.5 h-3.5 text-[#3d5a45]" />
                      </button>
                    ))
                ) : (
                  <p className="text-xs text-[#879688] px-2 py-1">
                    This thought is already in all your collections.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Growth Stage Selector */}
          <div className="pt-2 border-t border-[#eee9dc]">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#738274] mb-2">
              Growth Stage
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(stageConfig) as GrowthStage[]).map((stageKey) => {
                const config = stageConfig[stageKey];
                const Icon = config.icon;
                const isSelected = (thought.stage || 'seed') === stageKey;
                return (
                  <button
                    key={stageKey}
                    type="button"
                    onClick={() => handleStageSelect(stageKey)}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-[#3d5a45] bg-[#edf5ee] font-semibold text-[#253d2c]'
                        : 'border-[#e4ded0] bg-white text-[#5d6b5e] hover:bg-[#f6f4ee]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="capitalize">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Banner inside Modal */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Remove this thought from your garden?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#5e6c5f] hover:bg-rose-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg shadow-xs hover:bg-rose-700"
              >
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
