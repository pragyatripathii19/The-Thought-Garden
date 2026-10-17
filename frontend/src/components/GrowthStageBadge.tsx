import React from 'react';
import { Sprout, Leaf, Flower2, Sparkles } from 'lucide-react';
import { GrowthStage } from '../types';

interface GrowthStageBadgeProps {
  stage?: GrowthStage;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const stageConfig: Record<
  GrowthStage,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    styles: string;
    iconColor: string;
  }
> = {
  seed: {
    label: 'Seed',
    description: 'Raw, unfinished fragment',
    icon: Sprout,
    styles: 'text-[#86641E] bg-[#F7EDD2] border-[#E9D9AC] hover:bg-[#F3E6C4]',
    iconColor: 'text-[#A07A26]',
  },
  sprout: {
    label: 'Sprout',
    description: 'Revisited or elaborated idea',
    icon: Leaf,
    styles: 'text-garden-moss bg-[#ECF0DD] border-[#CBD5AE] hover:bg-[#E3E9CF]',
    iconColor: 'text-garden-moss',
  },
  bloom: {
    label: 'Bloom',
    description: 'Developing into a rich reflection',
    icon: Flower2,
    styles: 'text-[#8A4B44] bg-[#F6E8E1] border-[#E7CBBE] hover:bg-[#F2DFD6]',
    iconColor: 'text-[#9A5A50]',
  },
  mature: {
    label: 'Mature',
    description: 'Articulated thesis or foundation',
    icon: Sparkles,
    styles: 'text-garden-moss-dark bg-garden-pill border-[#BFCB9C] hover:bg-[#D3DCB6]',
    iconColor: 'text-garden-moss-dark',
  },
};

export const GrowthStageBadge: React.FC<GrowthStageBadgeProps> = ({
  stage = 'seed',
  size = 'sm',
  showLabel = true,
  className = '',
  onClick,
}) => {
  const config = stageConfig[stage] || stageConfig.seed;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] gap-1' 
    : 'px-3 py-1.5 text-xs gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`inline-flex items-center font-medium rounded-full border transition-all cursor-pointer active:scale-95 ${config.styles} ${sizeClasses} ${className}`}
        title={`Growth stage: ${config.label} (${config.description}) — Click to change stage`}
      >
        <Icon className={`${iconSize} ${config.iconColor}`} />
        {showLabel && <span>{config.label}</span>}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${config.styles} ${sizeClasses} ${className}`}
      title={`Growth stage: ${config.label} (${config.description})`}
    >
      <Icon className={`${iconSize} ${config.iconColor}`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
