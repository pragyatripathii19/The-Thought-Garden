import { Collection } from '../types';

export const STARTER_COLLECTIONS: Collection[] = [
  {
    id: 'col-startup-ideas',
    name: 'Startup Ideas',
    description: 'Ideas, products and business opportunities.',
    colorVariant: 'green',
    iconType: 'sprout',
    origin: 'starter',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col-writing',
    name: 'Writing',
    description: 'Blog ideas, drafts, quotes and more.',
    colorVariant: 'rose',
    iconType: 'pencil',
    origin: 'starter',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col-things-to-research',
    name: 'Things to Research',
    description: 'Questions, topics and areas to explore.',
    colorVariant: 'purple',
    iconType: 'search',
    origin: 'starter',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col-tasks-to-revisit',
    name: 'Tasks to Revisit',
    description: 'Reminders, follow-ups and action items.',
    colorVariant: 'amber',
    iconType: 'check',
    origin: 'starter',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/** Longest thought the server accepts (backend/garden.cjs MAX_TEXT). */
export const MAX_THOUGHT_LENGTH = 20000;
