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
    <section className="bg-garden-card/85 border border-garden-line rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-garden-pill/70 text-garden-moss flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-serif text-2xl leading-tight font-semibold text-garden-ink">These thoughts seem related</h3>
            <p className="text-sm text-garden-ink-soft">Group them into a collection?</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dismissGroupSuggestion(suggestion.id)}
          className="p-1.5 text-garden-ink-faint hover:text-garden-ink rounded-lg"
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
            className="p-4 bg-[#FDFBF3] rounded-xl border border-garden-line-soft text-left hover:border-[#D6CAA6] transition-colors"
          >
            <p className="text-garden-ink text-sm line-clamp-3 leading-relaxed">{t.text}</p>
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
          className="flex-1 min-w-0 px-3.5 py-2 bg-[#FDFBF3] rounded-full border border-garden-line text-sm text-garden-ink focus:outline-none focus:border-[#BFB38F]"
        />
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => dismissGroupSuggestion(suggestion.id)}
            className="text-sm text-garden-ink-soft hover:text-garden-ink"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!name.trim() || isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-garden-moss hover:bg-garden-moss-dark disabled:opacity-40 text-[#F4EEDB] text-sm font-semibold transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{isSaving ? 'Grouping…' : 'Group them'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
