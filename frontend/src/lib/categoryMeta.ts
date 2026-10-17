import { Thought } from '../types';
import {
  Link2,
  Search,
  PenTool,
  CheckSquare,
  Lightbulb,
  Sprout,
  LucideIcon,
} from 'lucide-react';

export interface ThoughtCategoryMeta {
  label: string;
  badgeBg: string;
  iconBg: string;
  Icon: LucideIcon;
}

// One calm pill style for every category; the icon carries the identity.
const TAG = 'bg-garden-tag text-garden-tag-ink border-garden-line';

export function getThoughtCategoryMeta(thought: Thought): ThoughtCategoryMeta {
  if (thought.category === 'connection') {
    return {
      label: 'Connection',
      badgeBg: TAG,
      iconBg: 'bg-garden-paper-deep text-garden-ink-soft',
      Icon: Link2,
    };
  }
  if (thought.category === 'research' || thought.collectionIds?.includes('col-things-to-research')) {
    return {
      label: 'Research',
      badgeBg: TAG,
      iconBg: 'bg-garden-paper-deep text-garden-ink-soft',
      Icon: Search,
    };
  }
  if (thought.category === 'writing' || thought.collectionIds?.includes('col-writing')) {
    return {
      label: 'Writing',
      badgeBg: TAG,
      iconBg: 'bg-garden-paper-deep text-garden-ink-soft',
      Icon: PenTool,
    };
  }
  if (thought.category === 'task' || thought.collectionIds?.includes('col-tasks-to-revisit')) {
    return {
      label: 'Tasks',
      badgeBg: TAG,
      iconBg: 'bg-garden-paper-deep text-garden-ink-soft',
      Icon: CheckSquare,
    };
  }
  if (thought.category === 'idea' || thought.collectionIds?.includes('col-startup-ideas')) {
    return {
      label: 'Idea',
      badgeBg: TAG,
      iconBg: 'bg-garden-paper-deep text-garden-ink-soft',
      Icon: Lightbulb,
    };
  }

  return {
    label: 'Thought',
    badgeBg: TAG,
    iconBg: 'bg-garden-paper-deep text-garden-ink-soft',
    Icon: Sprout,
  };
}
