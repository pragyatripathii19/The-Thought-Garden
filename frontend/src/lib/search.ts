import { Thought, Collection } from '../types';

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchResults {
  matchingThoughts: Thought[];
  matchingCollections: Collection[];
  tokens: string[];
}

export function searchGarden(
  query: string,
  thoughts: Thought[],
  collections: Collection[]
): SearchResults {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return { matchingThoughts: [], matchingCollections: [], tokens: [] };
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);

  // Match thoughts: all tokens must appear in the normalized thought text
  const matchingThoughts = thoughts.filter((thought) => {
    const normalizedContent = normalizeText(thought.text);
    return tokens.every((token) => normalizedContent.includes(token));
  });

  // Match collections: all tokens must appear in name or description
  const matchingCollections = collections.filter((collection) => {
    const normalizedName = normalizeText(collection.name);
    const normalizedDesc = normalizeText(collection.description || '');
    const combined = `${normalizedName} ${normalizedDesc}`;
    return tokens.every((token) => combined.includes(token));
  });

  return {
    matchingThoughts,
    matchingCollections,
    tokens,
  };
}
