import { Collection, Thought, Connection } from '../types';

export const STARTER_COLLECTIONS: Collection[] = [
  {
    id: 'col-startup-ideas',
    name: 'Startup Ideas',
    description: 'Ideas, products and business opportunities.',
    colorVariant: 'green',
    iconType: 'sprout',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col-writing',
    name: 'Writing',
    description: 'Blog ideas, drafts, quotes and more.',
    colorVariant: 'rose',
    iconType: 'pencil',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col-things-to-research',
    name: 'Things to Research',
    description: 'Questions, topics and areas to explore.',
    colorVariant: 'purple',
    iconType: 'search',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'col-tasks-to-revisit',
    name: 'Tasks to Revisit',
    description: 'Reminders, follow-ups and action items.',
    colorVariant: 'amber',
    iconType: 'check',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getStarterThoughts(): Thought[] {
  const now = Date.now();
  return [
    {
      id: 'thought-ref-1',
      text: 'Maybe these three thoughts are actually connected.',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-startup-ideas'],
      stage: 'sprout',
      category: 'connection',
      isSaved: true,
    },
    {
      id: 'thought-ref-2',
      text: 'Need to research how people with ADHD organize their lives.',
      createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-things-to-research'],
      stage: 'seed',
      category: 'research',
    },
    {
      id: 'thought-ref-3',
      text: "Blog idea about how someone else's belief in you changes everything.",
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-writing'],
      stage: 'bloom',
      category: 'writing',
    },
    {
      id: 'thought-ref-4',
      text: 'Remember to look into that Python library tomorrow.',
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-tasks-to-revisit'],
      stage: 'seed',
      category: 'task',
    },
    {
      id: 'thought-ref-5',
      text: 'An app that helps people stop forgetting their ideas.',
      createdAt: new Date(now - 2 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      collectionIds: ['col-startup-ideas'],
      stage: 'sprout',
      category: 'idea',
    },
    {
      id: 'thought-ref-6',
      text: 'A platform for creators to monetize their small ideas.',
      createdAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-startup-ideas'],
      stage: 'seed',
      category: 'idea',
    },
    {
      id: 'thought-ref-7',
      text: 'Could there be a better way to organize digital notes?',
      createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-things-to-research', 'col-startup-ideas'],
      stage: 'seed',
      category: 'research',
    },
    {
      id: 'thought-ref-8',
      text: 'Idea: AI-powered habit tracker for students.',
      createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      collectionIds: ['col-startup-ideas'],
      stage: 'sprout',
      category: 'idea',
    },
  ];
}

export function getStarterConnections(): Connection[] {
  const now = Date.now();
  return [
    {
      id: 'conn-ref-1',
      sourceThoughtId: 'thought-ref-1',
      targetThoughtId: 'thought-ref-5',
      status: 'accepted',
      score: 3,
      reason: 'Both explore apps and creative thinking',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'conn-ref-2',
      sourceThoughtId: 'thought-ref-1',
      targetThoughtId: 'thought-ref-2',
      status: 'accepted',
      score: 2,
      reason: 'Shared theme of cognitive organization',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'conn-ref-3',
      sourceThoughtId: 'thought-ref-1',
      targetThoughtId: 'thought-ref-3',
      status: 'accepted',
      score: 2,
      reason: 'Creative expression and beliefs',
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
