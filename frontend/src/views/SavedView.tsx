import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { formatRelativeTime } from '../lib/time';
import { ThoughtDetailModal } from '../components/ThoughtDetailModal';
import { GrowthStageBadge } from '../components/GrowthStageBadge';

export const SavedView: React.FC = () => {
  const { thoughts, updateThought, deleteThought } = useThoughts();
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null);

  const savedThoughts = thoughts.filter((t) => t.isSaved);
  const selectedThought = thoughts.find((t) => t.id === selectedThoughtId) || null;

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#eee9dc] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#fbf3e4] text-[#8f5a23] flex items-center justify-center">
            <Bookmark className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#233126] tracking-tight">
              Saved Thoughts
            </h2>
            <p className="text-xs text-[#718273] mt-0.5">
              {savedThoughts.length} {savedThoughts.length === 1 ? 'thought' : 'thoughts'} pinned in your garden
            </p>
          </div>
        </div>
      </div>

      {/* Thought List or Empty State */}
      {savedThoughts.length === 0 ? (
        <div className="py-16 text-center bg-white border border-dashed border-[#e4ded0] rounded-3xl p-6 space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#faf8f2] text-[#8f5a23] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-serif text-base font-semibold text-[#253227]">
            No saved thoughts yet
          </p>
          <p className="text-xs text-[#718273] max-w-sm mx-auto leading-relaxed">
            When you inspect any thought, tap the 📌 bookmark icon to pin it here for easy return.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedThoughts.map((thought) => (
            <div
              key={thought.id}
              onClick={() => setSelectedThoughtId(thought.id)}
              className="bg-white border border-[#e2dcd0] hover:border-[#b8caa0] p-4 rounded-2xl shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#233126] group-hover:text-[#18231a] leading-relaxed whitespace-pre-wrap">
                  {thought.text}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#869688] mt-2">
                  <span>{formatRelativeTime(thought.createdAt)}</span>
                  <span>•</span>
                  <span className="text-amber-800 font-medium">📌 Saved</span>
                </div>
              </div>

              <GrowthStageBadge stage={thought.stage || 'seed'} size="sm" />
            </div>
          ))}
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
    </div>
  );
};
