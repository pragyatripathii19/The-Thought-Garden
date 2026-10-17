import React from 'react';
import { Check, Sprout } from 'lucide-react';
import { CUSTOM_REASON_MAX, REASON_OPTIONS } from '../lib/profileReasons';

interface ReasonPickerProps {
  /** Selected option ids. */
  selected: string[];
  onChange: (next: string[]) => void;
  /** The person's own answer ("Something else"). */
  custom: string;
  onCustomChange: (text: string) => void;
  /** Shown under the free-text box, e.g. what happens with the answer. */
  customHint?: string;
}

const tile = (isSelected: boolean) =>
  `flex items-start gap-2.5 p-2.5 rounded-xl text-left border text-xs transition-all ${
    isSelected
      ? 'bg-garden-pill/60 border-[#CBD5AE] text-garden-ink'
      : 'bg-garden-card border-garden-line text-garden-ink-soft hover:border-[#D6CAA6]'
  }`;

const box = (isSelected: boolean) =>
  `w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
    isSelected ? 'bg-garden-moss text-garden-paper border-garden-moss' : 'border-garden-line bg-transparent'
  }`;

/** Multi-select grid of reasons for using the garden, plus a free-text option. */
export const ReasonPicker: React.FC<ReasonPickerProps> = ({ selected, onChange, custom, onCustomChange, customHint }) => {
  // Open while there's text (e.g. a saved answer) or after the person picks "Something else".
  const [opened, setOpened] = React.useState(false);
  const isCustomOpen = opened || custom.length > 0;
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id]);

  const toggleCustom = () => {
    if (isCustomOpen) onCustomChange('');
    setOpened(!isCustomOpen);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {REASON_OPTIONS.map(({ id, label, desc, Icon }) => {
          const isSelected = selected.includes(id);
          return (
            <button key={id} type="button" aria-pressed={isSelected} onClick={() => toggle(id)} className={tile(isSelected)}>
              <span className={box(isSelected)}>{isSelected && <Check className="w-3 h-3 stroke-[3]" />}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-semibold text-garden-ink">
                  <Icon className="w-3.5 h-3.5 text-garden-moss shrink-0" strokeWidth={2} />
                  {label}
                </span>
                <span className="block text-[11px] text-garden-ink-soft">{desc}</span>
              </span>
            </button>
          );
        })}
        <button type="button" aria-pressed={isCustomOpen} onClick={toggleCustom} className={tile(isCustomOpen)}>
          <span className={box(isCustomOpen)}>{isCustomOpen && <Check className="w-3 h-3 stroke-[3]" />}</span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-semibold text-garden-ink">
              <Sprout className="w-3.5 h-3.5 text-garden-moss shrink-0" strokeWidth={2} />
              Something else
            </span>
            <span className="block text-[11px] text-garden-ink-soft">Tell us in your own words</span>
          </span>
        </button>
      </div>

      {isCustomOpen && (
        <div className="space-y-1">
          <label htmlFor="reason-custom" className="sr-only">
            What brings you here?
          </label>
          <input
            id="reason-custom"
            type="text"
            autoFocus
            maxLength={CUSTOM_REASON_MAX}
            placeholder="I'm here for storing thoughts on…"
            value={custom}
            onChange={(e) => onCustomChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-garden-card border border-garden-line text-sm text-garden-ink placeholder-garden-ink-faint focus:outline-none focus:border-[#BFB38F]"
          />
          {customHint && <p className="text-[11px] text-garden-ink-faint">{customHint}</p>}
        </div>
      )}
    </div>
  );
};
