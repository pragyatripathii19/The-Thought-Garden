import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  ChevronRight,
  MoreHorizontal,
  PenTool,
  CheckSquare,
  Sprout,
  Trash2,
  X,
  Check,
  AlertCircle,
  Leaf,
  Flower2,
} from 'lucide-react';
import { CollectionColorVariant, CollectionIconType, Collection } from '../types';
import { useThoughts } from '../context/StorageContext';
import { formatRelativeTime } from '../lib/time';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { getThoughtCategoryMeta } from '../lib/categoryMeta';

export const CollectionsView: React.FC = () => {
  const {
    collections,
    thoughts,
    activeCollectionId,
    setActiveCollectionId,
    createCollection,
    deleteCollection,
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
  const [selectedIcon, setSelectedIcon] = useState<CollectionIconType>('sprout');

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
      setSelectedIcon('sprout');
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

  const getCollectionIconStyles = (collection: Collection) => {
    let Icon = Sprout;
    if (collection.iconType === 'pencil' || collection.id === 'col-writing') Icon = PenTool;
    else if (collection.iconType === 'search' || collection.id === 'col-things-to-research') Icon = Search;
    else if (collection.iconType === 'check' || collection.id === 'col-tasks-to-revisit') Icon = CheckSquare;
    else if (collection.iconType === 'leaf') Icon = Leaf;
    else if (collection.iconType === 'flower') Icon = Flower2;
    else if (collection.iconType === 'sprout' || collection.id === 'col-startup-ideas') Icon = Sprout;

    if (collection.colorVariant === 'rose' || collection.id === 'col-writing') {
      return {
        iconBg: 'bg-[#fae2e3] text-[#8c3b42]',
        Icon,
      };
    }
    if (collection.colorVariant === 'purple' || collection.id === 'col-things-to-research') {
      return {
        iconBg: 'bg-[#e7e4f6] text-[#4f4886]',
        Icon,
      };
    }
    if (collection.colorVariant === 'amber' || collection.id === 'col-tasks-to-revisit') {
      return {
        iconBg: 'bg-[#fae8d4] text-[#855320]',
        Icon,
      };
    }
    return {
      iconBg: 'bg-[#dcebdd] text-[#34593e]',
      Icon,
    };
  };

  // SCREEN B: Single Collection Detail View
  if (activeCollection) {
    return (
      <div className="space-y-6 pb-16 max-w-2xl mx-auto">
        {/* Collection Header */}
        <div className="flex items-start justify-between border-b border-[#eee9dc] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveCollectionId(null)}
              className="p-1.5 text-[#5e6c5f] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
              aria-label="Back to all collections"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
                {activeCollection.name}
              </h2>
              <p className="text-xs text-[#718273] mt-0.5">
                {activeThoughts.length} thoughts
                {activeCollection.description && ` • ${activeCollection.description}`}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="p-1.5 text-[#7c8779] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors"
              aria-label="Collection options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOptionsMenuOpen && (
              <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-[#e4ded0] rounded-2xl shadow-lg p-1.5 animate-fade-in text-xs">
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
          <div className="py-16 text-center bg-white border border-dashed border-[#e4ded0] rounded-3xl p-6">
            <Sprout className="w-8 h-8 mx-auto text-[#628469] mb-2 opacity-80" />
            <p className="font-serif text-base font-semibold text-[#253227]">
              No thoughts in this collection yet
            </p>
            <p className="text-xs text-[#718273] mt-1 max-w-sm mx-auto">
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
                  className="bg-white border border-[#e2dcd0] hover:border-[#b8caa0] p-4 rounded-2xl shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${meta.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-[#233126] group-hover:text-[#18231a] leading-relaxed">
                        {thought.text}
                      </p>
                      <span className="text-[11px] text-[#869688] mt-1 block">
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
        />

        {/* Delete Collection Modal */}
        {collectionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-white border border-[#e4ded0] rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#233126]">
                  Delete "{collectionToDelete.name}"?
                </h3>
              </div>
              <p className="text-xs text-[#6e7d70] leading-relaxed bg-[#faf8f4] p-3 rounded-xl border border-[#ede9df]">
                <strong>Your thoughts are safe:</strong> Removing this collection will never delete member thoughts.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectionToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6e7d70] hover:bg-[#ede9df]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCollection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
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
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      {/* Header matching bottom-left reference */}
      <div className="flex items-center justify-between border-b border-[#eee9dc] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-1.5 text-[#5e6c5f] hover:text-[#253227] hover:bg-[#ede8dc] rounded-xl transition-colors sm:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
            Collections
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsSearchActive(!isSearchActive)}
          className="p-1.5 text-[#6e7d70] hover:text-[#233126] hover:bg-[#ede8dc] rounded-xl transition-colors"
          aria-label="Search collections"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Optional Search Bar */}
      {isSearchActive && (
        <div className="relative animate-fade-in">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b998d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e4ded0] rounded-xl text-xs text-[#233126] focus:border-[#7a9d83] focus:outline-hidden"
            autoFocus
          />
        </div>
      )}

      {/* List of Collections Cards matching Reference */}
      <div className="space-y-3">
        {filteredCollections.map((col) => {
          const count = thoughts.filter((t) => t.collectionIds?.includes(col.id)).length;
          const styles = getCollectionIconStyles(col);
          const Icon = styles.Icon;

          return (
            <div
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className="bg-white border border-[#e2dcd0] hover:border-[#b8caa0] p-4 rounded-2xl flex items-center justify-between cursor-pointer shadow-xs hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-semibold text-[#233126] leading-tight">
                    {col.name}
                  </h3>
                  <div className="text-[11px] text-[#788779] font-medium mt-0.5">
                    {count} thoughts
                  </div>
                  {col.description && (
                    <p className="text-xs text-[#6e7d70] truncate mt-0.5">
                      {col.description}
                    </p>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-[#9cb09f] group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          );
        })}

        {/* New Collection Action Card */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#fcfbf8] border border-dashed border-[#d8d2c4] hover:border-[#7a9d83] p-4 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-colors group mt-2"
        >
          <div className="w-10 h-10 rounded-full bg-[#ede9dd] group-hover:bg-[#dce9df] text-[#5e6c5f] group-hover:text-[#34593e] flex items-center justify-center shrink-0 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#233126]">
              New Collection
            </h3>
            <p className="text-xs text-[#788779]">
              Create a custom collection (optional).
            </p>
          </div>
        </div>
      </div>

      {/* Create Collection Dialog Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233126]/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white border border-[#e4ded0] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eee9dc]">
              <h3 className="font-serif text-xl font-bold text-[#233126]">
                New Collection
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#7c8779] hover:text-[#233126] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69786a] mb-1.5">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Work Reflections, Book Notes..."
                  disabled={isSaving}
                  className="w-full px-4 py-2.5 bg-[#faf8f4] rounded-xl border border-[#e4ded0] focus:border-[#7a9d83] focus:outline-hidden text-[#233126] text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69786a] mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Brief note on what belongs here..."
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-[#faf8f4] rounded-xl border border-[#e4ded0] focus:border-[#7a9d83] focus:outline-hidden text-[#233126] text-sm resize-none"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69786a] mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'green', label: 'Sage', bg: 'bg-[#dcebdd] border-[#b8d4bd]' },
                    { id: 'rose', label: 'Rose', bg: 'bg-[#fae2e3] border-[#eec2c5]' },
                    { id: 'purple', label: 'Lavender', bg: 'bg-[#e7e4f6] border-[#cecaec]' },
                    { id: 'amber', label: 'Amber', bg: 'bg-[#fae8d4] border-[#ebd0b4]' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id as CollectionColorVariant)}
                      className={`h-8 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${c.bg} ${
                        selectedColor === c.id ? 'ring-2 ring-[#3d5a45] ring-offset-1 font-semibold' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedColor === c.id && <Check className="w-3 h-3 text-[#233126]" />}
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69786a] mb-1.5">
                  Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'sprout', label: 'Sprout', Icon: Sprout },
                    { id: 'leaf', label: 'Leaf', Icon: Leaf },
                    { id: 'flower', label: 'Flower', Icon: Flower2 },
                    { id: 'pencil', label: 'Writing', Icon: PenTool },
                    { id: 'search', label: 'Search', Icon: Search },
                    { id: 'check', label: 'Tasks', Icon: CheckSquare },
                  ].map((ic) => {
                    const IconComponent = ic.Icon;
                    const isSelected = selectedIcon === ic.id;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setSelectedIcon(ic.id as CollectionIconType)}
                        className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#3d5a45] text-white border-[#3d5a45] shadow-xs'
                            : 'bg-white text-[#5d6b5e] border-[#e4ded0] hover:bg-[#faf8f4]'
                        }`}
                        title={ic.label}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{ic.label}</span>
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
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6e7d70] hover:bg-[#ede9df]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColName.trim() || isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3d5a45] hover:bg-[#344e3b] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs"
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
