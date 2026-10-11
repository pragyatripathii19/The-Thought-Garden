import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useOrganizer } from '../context/OrganizerContext';
import { GroupSuggestion } from '../lib/organize/types';

interface GroupSuggestionCardProps {
  suggestion: GroupSuggestion;
  onOpenThought: (id: string) => void;
}

/**
 * "These thoughts seem related" — produced by the on-device rule, which can
 * spot a pair but can't name a collection well, so the user confirms the name.
 */
export const GroupSuggestionCard: React.FC<GroupSuggestionCardProps> = ({ suggestion, onOpenThought }) => {
  const { thoughts } = useThoughts();
  const { acceptGroupSuggestion, dismissGroupSuggestion } = useOrganizer();
  const [name, setName] = useState(suggestion.name);
  const [isSaving, setIsSaving] = useState(false);

  const a = thoughts.find((t) => t.id === suggestion.thoughtId);
  const b = thoughts.find((t) => t.id === suggestion.partnerThoughtId);
  if (!a || !b) return null;

  const handleAccept = async () => {
    try {
      setIsSaving(true);
      await acceptGroupSuggestion(suggestion.id, name, suggestion.description);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-[#f3f7f4] border border-[#d6e5d8] rounded-2xl p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#3d5a45] text-white flex items-center justify-center">
            <FolderPlus className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="font-serif text-base font-semibold text-[#233126]">These thoughts seem related</h3>
            <p className="text-xs text-[#526e57] font-medium">Group them into a collection?</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismissGroupSuggestion(suggestion.id)}
          className="p-1 text-[#869688] hover:text-[#233126] rounded-lg"
          aria-label="Dismiss suggestion"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[a, b].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onOpenThought(t.id)}
            className="p-3.5 bg-white rounded-xl border border-[#dbe7dc] text-left shadow-xs hover:border-[#a8cca0] transition-colors"
          >
            <p className="text-[#233126] text-xs sm:text-sm line-clamp-3 leading-relaxed">{t.text}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
        <label htmlFor={`group-name-${suggestion.id}`} className="sr-only">
          Collection name
        </label>
        <input
          id={`group-name-${suggestion.id}`}
          type="text"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 bg-white rounded-xl border border-[#dbe7dc] text-xs text-[#233126] focus:border-[#7a9d83]"
        />
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => dismissGroupSuggestion(suggestion.id)}
            className="text-xs text-[#6e7d70] hover:text-[#233126]"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!name.trim() || isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3d5a45] hover:bg-[#344e3b] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Grouping…' : 'Group them'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
