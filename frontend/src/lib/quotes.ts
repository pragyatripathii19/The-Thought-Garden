/**
 * Rotating garden quotes — one is shown in the Sidebar.
 * Keyed to day-of-year so it's consistent within a day but changes daily.
 */

export const GARDEN_QUOTES: string[] = [
  'Small thoughts can grow into big things.',
  'Every idea deserves a place to take root.',
  'The garden tends itself — one thought at a time.',
  'Write it down. Let it breathe. Come back when ready.',
  'A seed does not apologise for not yet being a tree.',
  'Clarity grows in quiet soil.',
  'Ideas connect in ways we cannot yet see.',
  'Not all growth is visible. Most of it happens underground.',
  'Your thoughts are worth keeping.',
  'Plant the thought. The garden will do the rest.',
  'The most important thought is the one you nearly forgot.',
  'Reflection is the compost of the mind.',
];

/**
 * Returns a quote that changes daily but is consistent within a day.
 */
export function getDailyQuote(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return GARDEN_QUOTES[dayOfYear % GARDEN_QUOTES.length];
}
