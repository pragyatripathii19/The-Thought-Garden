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

export function getThoughtCategoryMeta(thought: Thought): ThoughtCategoryMeta {
  if (thought.category === 'connection') {
    return {
      label: 'Connection',
      badgeBg: 'bg-[#eef4fb] text-[#36618c] border-[#d4e4f5]',
      iconBg: 'bg-[#edf4fb] text-[#36618c]',
      Icon: Link2,
    };
  }
  if (thought.category === 'research' || thought.collectionIds?.includes('col-things-to-research')) {
    return {
      label: 'Research',
      badgeBg: 'bg-[#f4f3fa] text-[#554e8c] border-[#e1def4]',
      iconBg: 'bg-[#f4f3fa] text-[#554e8c]',
      Icon: Search,
    };
  }
  if (thought.category === 'writing' || thought.collectionIds?.includes('col-writing')) {
    return {
      label: 'Writing',
      badgeBg: 'bg-[#fdf2f2] text-[#8c3b42] border-[#f5d9db]',
      iconBg: 'bg-[#fdf2f2] text-[#8c3b42]',
      Icon: PenTool,
    };
  }
  if (thought.category === 'task' || thought.collectionIds?.includes('col-tasks-to-revisit')) {
    return {
      label: 'Tasks',
      badgeBg: 'bg-[#fdf6ee] text-[#855320] border-[#f5e3ce]',
      iconBg: 'bg-[#fdf6ee] text-[#855320]',
      Icon: CheckSquare,
    };
  }
  if (thought.category === 'idea' || thought.collectionIds?.includes('col-startup-ideas')) {
    return {
      label: 'Idea',
      badgeBg: 'bg-[#edf5ee] text-[#34593e] border-[#d5e6d8]',
      iconBg: 'bg-[#fef9e8] text-[#8a681c]',
      Icon: Lightbulb,
    };
  }

  return {
    label: 'Thought',
    badgeBg: 'bg-[#edf4ee] text-[#34593e] border-[#d5e6d8]',
    iconBg: 'bg-[#edf4ee] text-[#34593e]',
    Icon: Sprout,
  };
}
