import React from 'react';
import { Check } from 'lucide-react';
import { REASON_OPTIONS } from '../lib/profileReasons';

interface ReasonPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

/** Multi-select grid of reasons for using the garden. */
export const ReasonPicker: React.FC<ReasonPickerProps> = ({ selected, onChange }) => {
  const toggle = (label: string) =>
    onChange(selected.includes(label) ? selected.filter((r) => r !== label) : [...selected, label]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {REASON_OPTIONS.map((opt) => {
        const isSelected = selected.includes(opt.label);
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => toggle(opt.label)}
            className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left border text-xs transition-all ${
              isSelected
                ? 'bg-[#edf5ee] border-[#a5caa9] text-[#253e2a] font-medium shadow-xs'
                : 'bg-white border-[#e6e1d5] text-[#556557] hover:border-[#ccd7ce]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                isSelected ? 'bg-[#3d5a45] text-white border-[#3d5a45]' : 'border-[#c8c2b5] bg-transparent'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div>
              <div className="font-semibold">{opt.label}</div>
              <div className="text-[10px] text-[#78887a]">{opt.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
