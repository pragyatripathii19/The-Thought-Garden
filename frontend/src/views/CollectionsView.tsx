import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  ChevronRight,
  MoreHorizontal,
  Sprout,
  Trash2,
  X,
  Check,
  AlertCircle,
  Bookmark,
} from 'lucide-react';
import { CollectionColorVariant, CollectionIconType, Collection, NavTab } from '../types';
import { useThoughts } from '../context/StorageContext';
import { formatRelativeTime } from '../lib/time';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { getThoughtCategoryMeta } from '../lib/categoryMeta';
import { AutoBadge } from '../components/OrganizeToast';
import { CollectionIcon } from '../components/CollectionIcon';
import { ART } from '../lib/art';
import { COLLECTION_ICONS, COLLECTION_ICON_KEYS, suggestCollectionIcon } from '../lib/collectionIcons';

interface CollectionsViewProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({ onNavigateTab }) => {
  const {
    collections,
    thoughts,
    activeCollectionId,
    setActiveCollectionId,
    createCollection,
    deleteCollection,
    toggleSaveCollection,
    updateThought,
    deleteThought,
  } = useThoughts();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<CollectionColorVariant>('green');
  // Until the user picks an icon, the one suggested by the name and description is used.
  const [manualIcon, setManualIcon] = useState<CollectionIconType | null>(null);
  const suggestedIcon = suggestCollectionIcon(newColName, newColDesc);
  const selectedIcon = manualIcon ?? suggestedIcon;

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || null;
  const activeThoughts = activeCollection
    ? thoughts.filter((t) => t.collectionIds?.includes(activeCollection.id))
    : [];

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  // Filter collections by search query
  const filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColName.trim();
    if (!trimmed) {
      setCreateError('Collection name is required');
      return;
    }

    try {
      setIsSaving(true);
      setCreateError(null);
      const created = await createCollection(trimmed, newColDesc.trim() || undefined, {
        colorVariant: selectedColor,
        iconType: selectedIcon,
      });
      setNewColName('');
      setNewColDesc('');
      setSelectedColor('green');
      setManualIcon(null);
      setIsCreateModalOpen(false);
      setActiveCollectionId(created.id);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;
    try {
      await deleteCollection(collectionToDelete.id);
      if (activeCollectionId === collectionToDelete.id) {
        setActiveCollectionId(null);
      }
      setCollectionToDelete(null);
      setIsOptionsMenuOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // SCREEN B: Single Collection Detail View
  if (activeCollection) {
    return (
      <div className="space-y-6 pb-16">
        {/* Collection Header */}
        <div className="flex items-start justify-between pb-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveCollectionId(null)}
              className="p-1.5 text-garden-ink-soft hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
              aria-label="Back to all collections"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-[36px] sm:text-[42px] leading-tight font-semibold text-garden-ink tracking-tight">
                {activeCollection.name}
                {activeCollection.origin === 'auto' && <AutoBadge className="ml-2 align-middle" />}
              </h2>
              <p className="text-sm text-garden-ink-soft mt-1">
                {activeThoughts.length} {activeThoughts.length === 1 ? 'thought' : 'thoughts'}
                {activeCollection.description && ` • ${activeCollection.description}`}
              </p>
              {activeCollection.origin === 'auto' && activeCollection.autoReason && (
                <p className="text-[11px] text-garden-moss mt-1">
                  Created automatically: {activeCollection.autoReason}
                </p>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleSaveCollection(activeCollection.id)}
              className={`p-1.5 rounded-xl transition-colors hover:bg-garden-line ${
                activeCollection.isSaved ? 'text-garden-moss' : 'text-garden-ink-faint hover:text-garden-ink'
              }`}
              aria-pressed={Boolean(activeCollection.isSaved)}
              aria-label={activeCollection.isSaved ? 'Remove from Saved' : 'Save collection'}
              title={activeCollection.isSaved ? 'Saved' : 'Save collection'}
            >
              <Bookmark className={`w-5 h-5 ${activeCollection.isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="p-1.5 text-garden-ink-faint hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
              aria-label="Collection options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 bg-garden-card border border-garden-line rounded-2xl shadow-lg p-1.5 animate-fade-in text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCollectionToDelete(activeCollection);
                    setIsOptionsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Collection</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Thoughts inside this collection */}
        {activeThoughts.length === 0 ? (
          <div className="py-16 text-center bg-garden-card border border-dashed border-garden-line rounded-3xl p-6">
            <Sprout className="w-8 h-8 mx-auto text-garden-moss mb-2 opacity-80" />
            <p className="font-serif text-xl font-semibold text-garden-ink">
              No thoughts in this collection yet
            </p>
            <p className="text-xs text-garden-ink-soft mt-1 max-w-sm mx-auto">
              Open any thought on the Home screen and tag it with "{activeCollection.name}".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeThoughts.map((thought) => {
              const meta = getThoughtCategoryMeta(thought);
              const CategoryIcon = meta.Icon;

              return (
                <div
                  key={thought.id}
                  onClick={() => setSelectedThoughtId(thought.id)}
                  className="bg-garden-card border border-garden-line hover:border-[#D6CAA6] p-4 rounded-2xl cursor-pointer transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${meta.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-garden-ink group-hover:text-garden-ink leading-relaxed">
                        {thought.text}
                      </p>
                      <span className="text-[11px] text-garden-ink-faint mt-1 block">
                        {formatRelativeTime(thought.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${meta.badgeBg}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Thought Detail Modal */}
        <ThoughtDetailModal
          thought={selectedThought}
          isOpen={Boolean(selectedThought)}
          onClose={() => setSelectedThoughtId(null)}
          onUpdate={updateThought}
          onDelete={deleteThought}
          onSelectThought={(t) => setSelectedThoughtId(t.id)}
        />

        {/* Delete Collection Modal */}
        {collectionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-garden-ink/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-garden-card border border-garden-line rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-serif text-[26px] font-semibold text-garden-ink">
                  Delete "{collectionToDelete.name}"?
                </h3>
              </div>
              <p className="text-xs text-garden-ink-soft leading-relaxed bg-[#FDFBF3] p-3 rounded-xl border border-garden-line">
                <strong>Your thoughts are safe:</strong> Removing this collection will never delete member thoughts.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectionToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-garden-ink-soft hover:bg-garden-line"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCollection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-garden-paper rounded-xl text-xs font-semibold"
                >
                  Delete Collection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SCREEN A: Collections Overview
  return (
    <div className="space-y-6 pb-16">
      {/* Header under a mossy branch growing in from the right; its vines fade out before the cards. */}
      <div className="relative overflow-hidden pt-[30%] sm:pt-[13%]">
        <img
          src={ART.branch}
          alt=""
          aria-hidden="true"
          className="absolute -top-2 right-0 w-full sm:w-[78%] -scale-x-100 mask-fade-down saturate-[.85] opacity-95 pointer-events-none select-none"
        />
      <div className="relative z-10 flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab?.('garden')}
            className="p-1.5 text-garden-ink-soft hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors sm:hidden"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-serif text-[36px] sm:text-[42px] leading-tight font-semibold text-garden-ink tracking-tight">
            Collections
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsSearchActive(!isSearchActive)}
          className="p-1.5 text-garden-ink-soft hover:text-garden-ink hover:bg-garden-line rounded-xl transition-colors"
          aria-label="Search collections"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      </div>

      {/* Optional Search Bar */}
      {isSearchActive && (
        <div className="relative animate-fade-in">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-garden-ink-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full pl-10 pr-4 py-2.5 bg-garden-card border border-garden-line rounded-xl text-xs text-garden-ink focus:border-[#BFB38F] focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* List of Collections Cards matching Reference */}
      <div className="space-y-3">
        {filteredCollections.map((col) => {
          const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;

          return (
            <div
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className="bg-garden-card border border-garden-line hover:border-[#D6CAA6] p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <CollectionIcon collection={col} />
                <div className="min-w-0">
                  <h3 className="font-serif text-xl font-semibold text-garden-ink leading-tight">
                    {col.name}
                    {col.origin === 'auto' && <AutoBadge className="ml-1.5 align-middle" />}
                  </h3>
                  <div className="text-[11px] text-garden-ink-soft font-medium mt-0.5">
                    {count} {count === 1 ? 'thought' : 'thoughts'}
                  </div>
                  {col.description && (
                    <p className="text-xs text-garden-ink-soft truncate mt-0.5">
                      {col.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveCollection(col.id);
                  }}
                  className={`p-1.5 rounded-xl transition-colors hover:bg-garden-paper-deep ${
                    col.isSaved ? 'text-garden-moss' : 'text-garden-ink-faint hover:text-garden-ink'
                  }`}
                  aria-pressed={Boolean(col.isSaved)}
                  aria-label={col.isSaved ? `Remove ${col.name} from Saved` : `Save ${col.name}`}
                  title={col.isSaved ? 'Saved' : 'Save collection'}
                >
                  <Bookmark className={`w-4 h-4 ${col.isSaved ? 'fill-current' : ''}`} />
                </button>
                <ChevronRight className="w-5 h-5 text-garden-ink-faint group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}

        {/* New Collection Action Card */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#FDFBF3] border border-dashed border-garden-line hover:border-[#D6CAA6] p-4 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-colors group mt-2"
        >
          <div className="w-10 h-10 rounded-full bg-garden-paper-deep group-hover:bg-garden-pill/60 text-garden-ink-soft group-hover:text-garden-moss flex items-center justify-center shrink-0 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-garden-ink">
              New Collection
            </h3>
            <p className="text-xs text-garden-ink-soft">
              Create a custom collection (optional).
            </p>
          </div>
        </div>
      </div>

      {/* Create Collection Dialog Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-garden-ink/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-garden-card border border-garden-line rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-garden-line">
              <h3 className="font-serif text-[26px] font-semibold text-garden-ink">
                New Collection
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-garden-ink-faint hover:text-garden-ink rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft mb-1.5">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Work Reflections, Book Notes..."
                  disabled={isSaving}
                  className="w-full px-4 py-2.5 bg-[#FDFBF3] rounded-xl border border-garden-line focus:border-[#BFB38F] focus:outline-none text-garden-ink text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Brief note on what belongs here..."
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-[#FDFBF3] rounded-xl border border-garden-line focus:border-[#BFB38F] focus:outline-none text-garden-ink text-sm resize-none"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'green', label: 'Sage', bg: 'bg-garden-pill/60 border-[#D6CAA6]' },
                    { id: 'rose', label: 'Rose', bg: 'bg-[#fae2e3] border-[#eec2c5]' },
                    { id: 'purple', label: 'Lavender', bg: 'bg-[#e7e4f6] border-[#cecaec]' },
                    { id: 'amber', label: 'Amber', bg: 'bg-[#fae8d4] border-[#ebd0b4]' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id as CollectionColorVariant)}
                      className={`h-8 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${c.bg} ${
                        selectedColor === c.id ? 'ring-2 ring-garden-moss ring-offset-1 font-semibold' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedColor === c.id && <Check className="w-3 h-3 text-garden-ink" />}
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">
                    Icon: {COLLECTION_ICONS[selectedIcon]?.label ?? 'Leaf'}
                  </span>
                  <span className="text-[11px] text-garden-ink-faint">
                    {manualIcon ? (
                      <button type="button" onClick={() => setManualIcon(null)} className="underline underline-offset-2">
                        Use suggested
                      </button>
                    ) : (
                      'Suggested from the name'
                    )}
                  </span>
                </div>
                <div
                  className="grid grid-cols-8 sm:grid-cols-11 gap-1.5 max-h-36 overflow-y-auto p-1 -m-1"
                  role="radiogroup"
                  aria-label="Collection icon"
                >
                  {COLLECTION_ICON_KEYS.map((key) => {
                    const { Icon: IconComponent, label } = COLLECTION_ICONS[key];
                    const isSelected = selectedIcon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setManualIcon(key)}
                        className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-garden-moss text-garden-paper border-garden-moss'
                            : 'bg-garden-card text-garden-ink-soft border-garden-line hover:bg-[#FDFBF3]'
                        }`}
                        title={label}
                        aria-label={label}
                      >
                        <IconComponent className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {createError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {createError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-garden-ink-soft hover:bg-garden-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColName.trim() || isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-garden-moss hover:bg-garden-moss disabled:opacity-50 text-garden-paper rounded-full text-xs font-semibold"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Creating...' : 'Create Collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
