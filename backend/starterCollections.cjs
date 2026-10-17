// Collections a new account starts with, chosen from why they joined (sign-up
// "reasons"). Reason ids match frontend/src/lib/profileReasons.ts; icon keys
// match frontend/src/lib/collectionIcons.ts.

const BY_REASON = {
  'brain-dump': {
    id: 'col-loose-thoughts',
    name: 'Loose Thoughts',
    description: 'Whatever is on your mind, unsorted.',
    colorVariant: 'green',
    iconType: 'mind',
  },
  'startup-ideas': {
    id: 'col-startup-ideas',
    name: 'Startup Ideas',
    description: 'Ideas, products and business opportunities.',
    colorVariant: 'green',
    iconType: 'sprout',
  },
  writing: {
    id: 'col-writing',
    name: 'Writing',
    description: 'Blog ideas, drafts, quotes and more.',
    colorVariant: 'rose',
    iconType: 'pencil',
  },
  research: {
    id: 'col-things-to-research',
    name: 'Things to Research',
    description: 'Questions, topics and areas to explore.',
    colorVariant: 'purple',
    iconType: 'search',
  },
  tasks: {
    id: 'col-tasks-to-revisit',
    name: 'Tasks to Revisit',
    description: 'Reminders, follow-ups and action items.',
    colorVariant: 'amber',
    iconType: 'check',
  },
  mindfulness: {
    id: 'col-reflections',
    name: 'Reflections',
    description: 'Feelings, lessons and quiet observations.',
    colorVariant: 'purple',
    iconType: 'calm',
  },
};

// Everyone who doesn't say why they're here gets the original four.
const DEFAULT_REASONS = ['startup-ideas', 'writing', 'research', 'tasks'];

const ICON_KEY = /^[a-z0-9-]{1,40}$/;

function titleCase(text) {
  return text.replace(/\s+/g, ' ').trim().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function slug(text) {
  return text.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'mine';
}

/**
 * Starter collections for a new account. `reasons` holds reason ids plus at most
 * one free-text answer, which becomes a collection of its own (with `customIcon`,
 * picked by the client from the same curated icon list, when valid).
 */
function starterCollections(reasons = [], customIcon = null, now = new Date()) {
  const at = now.toISOString();
  const ids = reasons.filter((r) => Object.prototype.hasOwnProperty.call(BY_REASON, r));
  const custom = reasons.find((r) => !Object.prototype.hasOwnProperty.call(BY_REASON, r));
  const chosen = ids.length > 0 || custom ? ids : DEFAULT_REASONS;

  const collections = chosen.map((id) => ({ ...BY_REASON[id] }));
  if (custom) {
    const name = titleCase(custom).slice(0, 40);
    if (!collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      collections.push({
        id: `col-${slug(custom)}`,
        name,
        description: 'Started from why you joined.',
        colorVariant: 'amber',
        iconType: typeof customIcon === 'string' && ICON_KEY.test(customIcon) ? customIcon : 'leaf',
      });
    }
  }
  return collections.map((c) => ({ ...c, origin: 'starter', autoReason: null, createdAt: at, updatedAt: at }));
}

module.exports = { starterCollections, BY_REASON };
