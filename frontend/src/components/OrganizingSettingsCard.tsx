import React, { useState } from 'react';
import { FolderTree, Undo2 } from 'lucide-react';
import { useThoughts } from '../context/StorageContext';
import { useOrganizer, EmbedderStatus } from '../context/OrganizerContext';
import { formatRelativeTime } from '../lib/time';

const STATUS_COPY: Record<EmbedderStatus, string> = {
  idle: 'The on-device model loads the first time it is needed.',
  loading: 'Loading the on-device model…',
  ready: 'On-device model ready.',
  unsupported: 'This browser can’t run the on-device model, so automatic organising is unavailable.',
  error: 'The on-device model couldn’t load (are you offline?). It will retry with your next thought.',
};

const SOURCE_LABEL = { llm: 'Smart', local: 'On-device', 'user-accepted': 'You accepted' } as const;

interface SwitchProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({ id, checked, disabled, onChange }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      checked ? 'bg-garden-moss' : 'bg-garden-line'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-garden-card shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export const OrganizingSettingsCard: React.FC = () => {
  const { thoughts, userProfile } = useThoughts();
  const {
    settings,
    updateSettings,
    smartAvailable,
    smartPause,
    embedderStatus,
    isWorking,
    events,
    undoEvents,
    organizeExisting,
  } = useOrganizer();
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const smartDisabledReason = !smartAvailable
    ? 'Not available right now: the server has no AI service configured.'
    : !userProfile
    ? 'Finish setting up your profile to use Smart organising.'
    : !settings.autoOrganize
    ? 'Turn on automatic organising first.'
    : null;

  const resumeTime = smartPause
    ? new Date(smartPause.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';
  const pauseMessage =
    !smartPause || !settings.smartOrganizing || smartDisabledReason
      ? null
      : smartPause.reason === 'rate-limited'
      ? `The AI service is busy, so new thoughts are organised on this device until about ${resumeTime}.`
      : smartPause.reason === 'unavailable'
      ? `Smart organising isn't available right now, so new thoughts are organised on this device. It will try again around ${resumeTime}.`
      : `Couldn't reach the AI service, so new thoughts are organised on this device. Trying again around ${resumeTime}.`;

  const handleOrganizeExisting = async () => {
    const count = await organizeExisting();
    setQueuedMessage(
      count === 0 ? 'No ungrouped thoughts to organise.' : `Organising ${count} ungrouped thought${count === 1 ? '' : 's'}…`
    );
  };

  const thoughtText = (id: string) => thoughts.find((t) => t.id === id)?.text || 'A removed thought';

  return (
    <div className="bg-garden-card border border-garden-line rounded-2xl p-5 sm:p-6 space-y-5">
      <h3 className="font-serif text-2xl font-semibold text-garden-ink flex items-center gap-2">
        <FolderTree className="w-4 h-4 text-garden-ink-soft" />
        <span>Organising</span>
      </h3>

      {/* On-device organising */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label htmlFor="toggle-auto-organize" className="text-sm font-medium text-garden-ink">
            Organise on this device
          </label>
          <p className="text-xs text-garden-ink-soft leading-relaxed">
            Files similar thoughts into collections, right in your browser. Every change can be undone.
          </p>
          <p className="text-[11px] text-garden-ink-faint">
            {STATUS_COPY[embedderStatus]}
            {isWorking && ' Organising now…'}
          </p>
        </div>
        <Switch
          id="toggle-auto-organize"
          checked={settings.autoOrganize && embedderStatus !== 'unsupported'}
          disabled={embedderStatus === 'unsupported'}
          onChange={(checked) => updateSettings({ autoOrganize: checked })}
        />
      </div>

      {/* Smart organising (LLM, on by default) */}
      <div className="flex items-start justify-between gap-4 pt-4 border-t border-garden-line">
        <div className="space-y-1">
          <label htmlFor="toggle-smart-organizing" className="text-sm font-medium text-garden-ink">
            Smart organising (AI)
          </label>
          <p className="text-xs text-garden-ink-soft leading-relaxed">
            Uses an AI service for better grouping and names. Falls back to on-device organising when it’s unavailable.
          </p>
          <details className="text-xs text-garden-ink-soft">
            <summary className="cursor-pointer font-semibold text-garden-moss w-fit">How this works</summary>
            <p className="mt-1 leading-relaxed">
              Each new thought, up to 10 similar thoughts, your collection names and why you’re here (from your
              profile) go through the Thought Garden server to the AI provider. Our server doesn’t keep them; the
              provider’s terms apply.
            </p>
          </details>
          {smartDisabledReason && <p className="text-[11px] text-amber-800">{smartDisabledReason}</p>}
          {pauseMessage && (
            <p className="text-[11px] text-amber-800" role="status">
              {pauseMessage}
            </p>
          )}
        </div>
        <Switch
          id="toggle-smart-organizing"
          checked={settings.smartOrganizing && !smartDisabledReason}
          disabled={Boolean(smartDisabledReason)}
          onChange={(checked) => updateSettings({ smartOrganizing: checked })}
        />
      </div>

      {/* Organise existing */}
      <div className="pt-4 border-t border-garden-line flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleOrganizeExisting}
          disabled={!settings.autoOrganize || embedderStatus === 'unsupported'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-garden-card hover:bg-garden-paper-deep border border-garden-line text-garden-ink rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
        >
          Organise existing thoughts
        </button>
        <span className="text-[11px] text-garden-ink-soft">
          {queuedMessage || 'Looks at ungrouped thoughts you haven’t organised by hand.'}
        </span>
      </div>

      {/* Activity log */}
      <div className="pt-4 border-t border-garden-line space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-garden-ink-soft">Recent activity</span>
        {events.length === 0 ? (
          <p className="text-xs text-garden-ink-faint italic">Nothing organised automatically yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#FDFBF3] border border-garden-line"
              >
                <div className="min-w-0">
                  <p className="text-xs text-garden-ink">
                    {e.action === 'create' ? 'Created' : 'Added to'}{' '}
                    <span className="font-semibold">“{e.collectionName}”</span>
                    <span className="text-garden-ink-faint"> · {SOURCE_LABEL[e.source]} · {formatRelativeTime(e.createdAt)}</span>
                  </p>
                  <p className="text-[11px] text-garden-ink-soft truncate">{thoughtText(e.thoughtId)}</p>
                </div>
                {e.undoneAt ? (
                  <span className="text-[11px] text-garden-ink-faint shrink-0">Undone</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => undoEvents([e.id])}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-garden-moss hover:text-garden-ink shrink-0"
                  >
                    <Undo2 className="w-3 h-3" />
                    Undo
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
