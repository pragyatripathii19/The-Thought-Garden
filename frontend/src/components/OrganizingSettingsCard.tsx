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
      checked ? 'bg-[#3d5a45]' : 'bg-[#d8d2c4]'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

export const OrganizingSettingsCard: React.FC = () => {
  const { thoughts, userProfile } = useThoughts();
  const { settings, updateSettings, smartAvailable, embedderStatus, isWorking, events, undoEvents, organizeExisting } =
    useOrganizer();
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const smartDisabledReason = !smartAvailable
    ? 'Not available right now: the server has no AI service configured.'
    : !userProfile
    ? 'Finish setting up your profile to use Smart organising.'
    : !settings.autoOrganize
    ? 'Turn on automatic organising first.'
    : null;

  const handleOrganizeExisting = async () => {
    const count = await organizeExisting();
    setQueuedMessage(
      count === 0 ? 'No ungrouped thoughts to organise.' : `Organising ${count} ungrouped thought${count === 1 ? '' : 's'}…`
    );
  };

  const thoughtText = (id: string) => thoughts.find((t) => t.id === id)?.text || 'A removed thought';

  return (
    <div className="bg-white border border-[#e2dcd0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      <h3 className="font-serif text-lg font-semibold text-[#233126] flex items-center gap-2">
        <FolderTree className="w-4 h-4 text-[#738274]" />
        <span>Automatic organising</span>
      </h3>

      {/* On-device organising */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <label htmlFor="toggle-auto-organize" className="text-sm font-medium text-[#233126]">
            Organise on this device
          </label>
          <p className="text-xs text-[#718273] leading-relaxed">
            A small model running in your browser (about 25 MB, downloaded once) finds similar thoughts. Nothing is sent
            anywhere. Clear matches join a collection; close pairs are suggested on Home. Every change can be undone.
          </p>
          <p className="text-[11px] text-[#8b998d]">
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

      {/* Smart organising (opt-in LLM) */}
      <div className="flex items-start justify-between gap-4 pt-4 border-t border-[#eee9dc]">
        <div className="space-y-1">
          <label htmlFor="toggle-smart-organizing" className="text-sm font-medium text-[#233126]">
            Smart organising (AI)
          </label>
          <p className="text-xs text-[#718273] leading-relaxed">
            Better decisions and collection names. When on, each new thought, up to 10 similar thoughts and your
            collection names are sent through the Thought Garden server to an external AI service to decide where the
            thought fits. Our server doesn’t store them, but the AI provider’s terms apply. Off by default.
          </p>
          {smartDisabledReason && <p className="text-[11px] text-amber-800">{smartDisabledReason}</p>}
        </div>
        <Switch
          id="toggle-smart-organizing"
          checked={settings.smartOrganizing && !smartDisabledReason}
          disabled={Boolean(smartDisabledReason)}
          onChange={(checked) => updateSettings({ smartOrganizing: checked })}
        />
      </div>

      {/* Organise existing */}
      <div className="pt-4 border-t border-[#eee9dc] flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleOrganizeExisting}
          disabled={!settings.autoOrganize || embedderStatus === 'unsupported'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f6f4ee] border border-[#e4ded0] text-[#233126] rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
        >
          Organise existing thoughts
        </button>
        <span className="text-[11px] text-[#718273]">
          {queuedMessage || 'Looks at ungrouped thoughts you haven’t organised by hand.'}
        </span>
      </div>

      {/* Activity log */}
      <div className="pt-4 border-t border-[#eee9dc] space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-[#738274]">Recent activity</span>
        {events.length === 0 ? (
          <p className="text-xs text-[#879688] italic">Nothing organised automatically yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 8).map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#faf8f4] border border-[#ede9df]"
              >
                <div className="min-w-0">
                  <p className="text-xs text-[#233126]">
                    {e.action === 'create' ? 'Created' : 'Added to'}{' '}
                    <span className="font-semibold">“{e.collectionName}”</span>
                    <span className="text-[#869688]"> · {SOURCE_LABEL[e.source]} · {formatRelativeTime(e.createdAt)}</span>
                  </p>
                  <p className="text-[11px] text-[#718273] truncate">{thoughtText(e.thoughtId)}</p>
                </div>
                {e.undoneAt ? (
                  <span className="text-[11px] text-[#869688] shrink-0">Undone</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => undoEvents([e.id])}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#34593e] hover:text-[#233126] shrink-0"
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
