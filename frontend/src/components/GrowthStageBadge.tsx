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
    styles: 'text-clay-600 bg-clay-50 border-clay-200 hover:bg-clay-100/60',
    iconColor: 'text-clay-500',
  },
  sprout: {
    label: 'Sprout',
    description: 'Revisited or elaborated idea',
    icon: Leaf,
    styles: 'text-sage-700 bg-sage-50 border-sage-200 hover:bg-sage-100/60',
    iconColor: 'text-sage-600',
  },
  bloom: {
    label: 'Bloom',
    description: 'Developing into a rich reflection',
    icon: Flower2,
    styles: 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100/60',
    iconColor: 'text-rose-500',
  },
  mature: {
    label: 'Mature',
    description: 'Articulated thesis or foundation',
    icon: Sparkles,
    styles: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100/60',
    iconColor: 'text-amber-600',
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
