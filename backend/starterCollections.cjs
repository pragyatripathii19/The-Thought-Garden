// Collections every new account starts with. Keep in step with
// frontend/src/lib/defaults.ts (STARTER_COLLECTIONS).
const STARTER_COLLECTIONS = [
  {
    id: 'col-startup-ideas',
    name: 'Startup Ideas',
    description: 'Ideas, products and business opportunities.',
    colorVariant: 'green',
    iconType: 'sprout',
  },
  {
    id: 'col-writing',
    name: 'Writing',
    description: 'Blog ideas, drafts, quotes and more.',
    colorVariant: 'rose',
    iconType: 'pencil',
  },
  {
    id: 'col-things-to-research',
    name: 'Things to Research',
    description: 'Questions, topics and areas to explore.',
    colorVariant: 'purple',
    iconType: 'search',
  },
  {
    id: 'col-tasks-to-revisit',
    name: 'Tasks to Revisit',
    description: 'Reminders, follow-ups and action items.',
    colorVariant: 'amber',
    iconType: 'check',
  },
];

function starterCollections(now = new Date()) {
  const at = now.toISOString();
  return STARTER_COLLECTIONS.map((c) => ({
    ...c,
    origin: 'starter',
    autoReason: null,
    createdAt: at,
    updatedAt: at,
  }));
}

module.exports = { starterCollections };
