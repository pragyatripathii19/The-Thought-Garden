import { describe, it, expect } from 'vitest';
import {
  computeThoughtsPerDay,
  computeGardenStreak,
  computeTodayThoughtsCount,
  generateAdminSummaryReport,
} from './analytics';
import { AdminOverviewData, Thought } from '../types';
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

  it('summarises the whole pilot from the admin overview, never thought text', () => {
    const data: AdminOverviewData = {
      timeZone: 'Asia/Kolkata',
      summary: {
        totalUsers: 2, admins: 1, activeThisWeek: 2, activeToday: 1, thoughtsThisWeek: 5,
        totalThoughtsLogged: 12, totalFeedback: 1, undoRate: 0.25,
      },
      organizing: {
        actions: 8, undone: 2, llm: { actions: 4, undone: 1 }, onDevice: { actions: 4, undone: 1 }, smartOrganizingOn: 1,
      },
      features: {
        collectionsMade: 3, collectionsAuto: 2, connections: 4, savedThoughts: 2, savedCollections: 1,
        stages: { seed: 6, sprout: 4, bloom: 1, mature: 1 },
      },
      users: [
        {
          id: 'u1', name: 'Alex Rivera', email: 'alex@example.com', reasons: ['writing', 'learning Spanish'],
          isAdmin: false, smartOrganizing: true, createdAt: '2026-10-01T00:00:00.000Z',
          lastActiveAt: '2026-10-17T00:00:00.000Z', activeThisWeek: true, totalThoughts: 9, thoughtsToday: 1,
          thoughtsThisWeek: 4, daysActive30: 6, streak: 2, feedbackCount: 1, collections: 4, collectionsMade: 2,
          collectionsAuto: 1, connections: 3, savedThoughts: 2, savedCollections: 1, autoActions: 6, autoUndone: 1,
          activityHistory: [],
        },
      ],
      feedback: [
        { id: 'fb1', userName: 'Alex Rivera', category: 'suggestion', rating: 5, message: 'Love the zen feel', createdAt: localIso(0, 11) },
      ],
      thoughtsPerDayAgg: [],
    };
    const report = generateAdminSummaryReport(data);
    expect(report).toContain('Asia/Kolkata');
    expect(report).toContain('Active this week: 2 of 2');
    expect(report).toContain('Automatic actions: 8, undone: 2 (25%)');
    expect(report).toContain('Alex Rivera: 9 thoughts (4 this week), active 6 of the last 30 days');
    expect(report).toContain('Writing & journaling, learning Spanish');
    expect(report).toContain('Rating: 5/5 (Alex Rivera)');
    expect(report).toContain('Love the zen feel');
  });
});
