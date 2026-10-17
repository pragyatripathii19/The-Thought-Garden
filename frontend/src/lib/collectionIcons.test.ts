import { describe, it, expect } from 'vitest';
import {
  COLLECTION_ICON_KEYS,
  getCollectionIcon,
  isCollectionIconKey,
  suggestCollectionIcon,
} from './collectionIcons';
import { validateDecision } from './organize/validateDecision';
import { Leaf } from 'lucide-react';

describe('collection icon suggestions', () => {
  it.each([
    ['Travel plans', 'travel'],
    ['Trips I want to take', 'travel'],
    ['Book notes', 'book'],
    ['Recipes to try', 'food'],
    ['Gym & running', 'fitness'],
    ['Startup Ideas', 'idea'],
    ['Writing', 'pencil'],
    ['Things to Research', 'search'],
    ['Tasks to Revisit', 'check'],
    ['Budget 2027', 'money'],
    ['Movies to watch', 'film'],
    ['Side project: habit app', 'idea'],
    ['Code snippets', 'code'],
  ])('"%s" gets %s', (name, expected) => {
    expect(suggestCollectionIcon(name)).toBe(expected);
  });

  it('uses the description when the name says nothing', () => {
    expect(suggestCollectionIcon('Misc', 'songs and albums I love')).toBe('music');
  });

  it('prefers whole short words over accidental prefixes', () => {
    // "category" must not match the "cat" keyword, and "career" not "car".
    expect(suggestCollectionIcon('Career moves')).toBe('work');
    expect(suggestCollectionIcon('Category theory')).toBe('leaf');
  });

  it('falls back to a leaf when nothing matches', () => {
    expect(suggestCollectionIcon('Zxqv')).toBe('leaf');
    expect(suggestCollectionIcon('')).toBe('leaf');
  });

  it('always suggests a known icon, and unknown keys display as a leaf', () => {
    expect(COLLECTION_ICON_KEYS).toContain(suggestCollectionIcon('Anything at all'));
    expect(isCollectionIconKey('travel')).toBe(true);
    expect(isCollectionIconKey('not-an-icon')).toBe(false);
    expect(getCollectionIcon('not-an-icon')).toBe(Leaf);
    expect(getCollectionIcon(undefined)).toBe(Leaf);
  });

  it("keeps Smart organising's icon only if it is in the list", () => {
    const now = new Date().toISOString();
    const base = { createdAt: now, updatedAt: now, collectionIds: [] as string[] };
    const thought = { id: 'new', text: 'Plan a trip to Kyoto', ...base };
    const partner = { id: 'a', text: 'Look up flights to Japan', ...base };
    const ctx = { thought, candidateThoughtIds: new Set(['a']), thoughts: [thought, partner], collections: [] };
    const make = (icon: string) => ({
      action: 'create',
      newCollection: { name: 'Japan trip', description: '', partnerThoughtId: 'a', icon },
    });
    expect(validateDecision(make('travel'), ctx)).toMatchObject({ newCollection: { icon: 'travel' } });
    expect(validateDecision(make('rocket-ship-9000'), ctx)).toMatchObject({ action: 'create' });
    expect(validateDecision(make('rocket-ship-9000'), ctx)).not.toHaveProperty('newCollection.icon');
  });
});
