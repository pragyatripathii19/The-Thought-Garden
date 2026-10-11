import { describe, it, expect } from 'vitest';
import {
  computeThoughtsPerDay,
  computeGardenStreak,
  computeTodayThoughtsCount,
  generatePilotSummaryReport,
} from './analytics';
import { Thought } from '../types';
import { localDateKey } from './date';

/** ISO timestamp for a local wall-clock time `daysAgo` days back. */
function localIso(daysAgo: number, hours: number, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

describe('Local Usage Analytics Engine', () => {
  const today = localDateKey();
  const yesterday = localDateKey(localIso(1, 12));

  const mockThoughts: Thought[] = [
    {
      id: '1',
      text: 'Today thought 1',
      createdAt: localIso(0, 10),
      updatedAt: localIso(0, 10),
      collectionIds: [],
    },
    {
      id: '2',
      text: 'Today thought 2',
      createdAt: localIso(0, 12),
      updatedAt: localIso(0, 12),
      collectionIds: [],
    },
    {
      id: '3',
      text: 'Yesterday thought',
      createdAt: localIso(1, 9),
      updatedAt: localIso(1, 9),
      collectionIds: [],
    },
    {
      id: '4',
      text: 'Two days ago thought',
      createdAt: localIso(2, 8),
      updatedAt: localIso(2, 8),
      collectionIds: [],
    },
  ];

  it('computes today thought count accurately', () => {
    expect(computeTodayThoughtsCount(mockThoughts)).toBe(2);
  });

  it('counts a thought planted just after local midnight as today', () => {
    // In IST this is the previous day in UTC — the old toISOString() logic got it wrong.
    const justAfterMidnight: Thought = {
      id: 'night',
      text: 'Late-night idea',
      createdAt: localIso(0, 0, 30),
      updatedAt: localIso(0, 0, 30),
      collectionIds: [],
    };
    expect(computeTodayThoughtsCount([justAfterMidnight])).toBe(1);
    expect(computeGardenStreak([justAfterMidnight])).toBe(1);
  });

  it('computes consecutive streak correctly', () => {
    expect(computeGardenStreak(mockThoughts)).toBe(3);
  });

  it('computes daily metrics over 7 days', () => {
    const daily = computeThoughtsPerDay(mockThoughts, 7);
    expect(daily.length).toBe(7);
    const todayMetric = daily.find((d) => d.date === today);
    expect(todayMetric?.count).toBe(2);
    const yesterdayMetric = daily.find((d) => d.date === yesterday);
    expect(yesterdayMetric?.count).toBe(1);
  });

  it('generates diagnostic markdown summary with user profile and feedback', () => {
    const report = generatePilotSummaryReport(
      {
        id: 'u1',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        reasons: ['Startup Ideas'],
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      mockThoughts,
      [
        {
          id: 'fb1',
          category: 'suggestion',
          rating: 5,
          message: 'Love the zen feel',
          createdAt: localIso(0, 11),
        },
      ]
    );

    expect(report).toContain('Alex Rivera');
    expect(report).toContain('Startup Ideas');
    expect(report).toContain('Total Thoughts Planted: 4');
    expect(report).toContain('Love the zen feel');
  });
});
