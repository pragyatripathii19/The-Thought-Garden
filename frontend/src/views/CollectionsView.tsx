import React, { useState } from 'react';
import { Plus, Flower2, Sprout, Sparkles, Leaf, Trash2, ArrowLeft, X, Check, Calendar, AlertCircle } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { Collection } from '../types';
import { GrowthStageBadge } from '../components/GrowthStageBadge';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';

export const CollectionsView: React.FC = () => {
  const { collections, thoughts, createCollection, deleteCollection, updateThought, deleteThought } = useThoughts();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || null;
  const activeThoughts = activeCollection
    ? thoughts.filter((t) => t.collectionIds?.includes(activeCollection.id))
    : [];

  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

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
      await createCollection(trimmed, newColDesc.trim() || undefined);
      setNewColName('');
      setNewColDesc('');
      setIsCreateModalOpen(false);
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
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Determine botanical icon based on collection index or content
  const getCollectionIcon = (index: number) => {
    const icons = [Sprout, Leaf, Flower2, Sparkles];
    const Icon = icons[index % icons.length];
    return Icon;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {activeCollection ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveCollectionId(null)}
              className="p-2 bg-white border border-parchment-border hover:bg-parchment-soft rounded-xl text-stone-500 hover:text-earth-900 transition-colors shadow-soft"
              aria-label="Back to all collections"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-3xl font-semibold text-earth-900 tracking-tight">
                  {activeCollection.name}
                </h2>
                <span className="text-xs text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200 font-medium">
                  {activeThoughts.length} {activeThoughts.length === 1 ? 'thought' : 'thoughts'}
                </span>
              </div>
              {activeCollection.description && (
                <p className="text-xs text-stone-500 mt-1">{activeCollection.description}</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-serif text-3xl font-semibold text-earth-900 tracking-tight">
              My Collections
            </h2>
            <p className="text-sm text-stone-400 mt-1">
              Natural homes for related thoughts and reflections
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Main View: Either Drill-down Thoughts or Collections Grid */}
      {activeCollection ? (
        activeThoughts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/60 border border-dashed border-parchment-border rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-parchment-soft text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Sprout className="w-6 h-6 text-sage-500" />
            </div>
            <h3 className="font-serif text-lg font-medium text-earth-800 mb-1">
              No thoughts in this collection yet
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto mb-4">
              Open any thought on the Garden page and add it to "{activeCollection.name}".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeThoughts.map((thought) => (
              <div
                key={thought.id}
                onClick={() => setSelectedThoughtId(thought.id)}
                className="group relative bg-white border border-parchment-border hover:border-sage-400 rounded-2xl p-5 shadow-soft hover:shadow-soft-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <p className="text-earth-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {thought.text}
                </p>
                <div className="mt-4 pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {formatTimestamp(thought.createdAt)}
                  </span>
                  <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : collections.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/60 border border-dashed border-parchment-border rounded-3xl">
          <div className="w-14 h-14 rounded-full bg-sage-50 text-sage-600 flex items-center justify-center mx-auto mb-3">
            <Leaf className="w-7 h-7 text-sage-500" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-earth-900 mb-1.5">
            Your collections will sprout here
          </h3>
          <p className="text-sm text-stone-400 max-w-md mx-auto mb-5 leading-relaxed">
            Collections group thoughts around shared themes. Plant your first collection whenever you are ready.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Collection</span>
          </button>
        </div>
      ) : (
        /* Grid of Real Collection Cards (matching reference) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {collections.map((collection, idx) => {
            const memberCount = thoughts.filter((t) => t.collectionIds?.includes(collection.id)).length;
            const Icon = getCollectionIcon(idx);

            return (
              <div
                key={collection.id}
                onClick={() => setActiveCollectionId(collection.id)}
                className="group relative bg-white border border-parchment-border hover:border-sage-400/90 rounded-3xl p-6 shadow-soft hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between h-72 cursor-pointer"
              >
                {/* Top header: Member count badge & Delete button */}
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-medium">
                    {memberCount} {memberCount === 1 ? 'THOUGHT' : 'THOUGHTS'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollectionToDelete(collection);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-all"
                    title="Delete collection"
                    aria-label="Delete collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Botanical Centerpiece */}
                <div className="flex-1 flex items-center justify-center my-3 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-24 h-24 rounded-full bg-parchment-soft/80 border border-parchment-border/60 flex items-center justify-center shadow-soft">
                    <Icon className="w-10 h-10 text-sage-600 group-hover:text-sage-700 transition-colors" />
                  </div>
                </div>

                {/* Bottom details */}
                <div className="pt-2 border-t border-parchment-border/60">
                  <h3 className="font-serif text-base font-semibold text-earth-900 group-hover:text-sage-700 transition-colors truncate">
                    {collection.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1 text-xs text-stone-400">
                    <span>{formatTimestamp(collection.createdAt)}</span>
                    <span className="text-[11px] text-sage-600 group-hover:translate-x-0.5 transition-transform">
                      View thoughts &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thought Detail Modal for clicking a thought inside a collection */}
      <ThoughtDetailModal
        thought={selectedThought}
        isOpen={Boolean(selectedThought)}
        onClose={() => setSelectedThoughtId(null)}
        onUpdate={updateThought}
        onDelete={deleteThought}
      />

      {/* Create Collection Dialog Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-parchment-border rounded-3xl p-6 shadow-soft-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-parchment-border">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-sage-600" />
                <h3 className="font-serif text-xl font-semibold text-earth-900">
                  Plant a Collection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-earth-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Work Reflections, Book Notes..."
                  disabled={isSaving}
                  className="w-full px-4 py-2.5 bg-parchment-soft/50 rounded-xl border border-parchment-border focus:border-sage-400 focus:ring-2 focus:ring-sage-200 text-earth-900 text-sm transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Brief note on what belongs here..."
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-parchment-soft/50 rounded-xl border border-parchment-border focus:border-sage-400 focus:ring-2 focus:ring-sage-200 text-earth-900 text-sm resize-none transition-all"
                />
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
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-parchment-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColName.trim() || isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Planting...' : 'Plant Collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Collection Confirmation Modal */}
      {collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-parchment-border rounded-3xl p-6 shadow-soft-lg space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-earth-900">
                Remove "{collectionToDelete.name}"?
              </h3>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed bg-parchment-soft/40 p-3 rounded-xl border border-parchment-border">
              <strong>Your thoughts are safe:</strong> Deleting this collection will <em>never</em> delete its member thoughts. It only removes this grouping.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCollectionToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-parchment-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCollection}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
