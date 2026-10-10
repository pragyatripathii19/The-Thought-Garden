import { describe, it, expect } from 'vitest';
import {
  computeThoughtsPerDay,
  computeGardenStreak,
  computeTodayThoughtsCount,
  generatePilotSummaryReport,
} from './analytics';
import { Thought } from '../types';

describe('Local Usage Analytics Engine', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);

  const mockThoughts: Thought[] = [
    {
      id: '1',
      text: 'Today thought 1',
      createdAt: `${today}T10:00:00.000Z`,
      updatedAt: `${today}T10:00:00.000Z`,
      collectionIds: [],
    },
    {
      id: '2',
      text: 'Today thought 2',
      createdAt: `${today}T12:00:00.000Z`,
      updatedAt: `${today}T12:00:00.000Z`,
      collectionIds: [],
    },
    {
      id: '3',
      text: 'Yesterday thought',
      createdAt: `${yesterday}T09:00:00.000Z`,
      updatedAt: `${yesterday}T09:00:00.000Z`,
      collectionIds: [],
    },
    {
      id: '4',
      text: 'Two days ago thought',
      createdAt: `${twoDaysAgo}T08:00:00.000Z`,
      updatedAt: `${twoDaysAgo}T08:00:00.000Z`,
      collectionIds: [],
    },
  ];

  it('computes today thought count accurately', () => {
    expect(computeTodayThoughtsCount(mockThoughts)).toBe(2);
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
          createdAt: `${today}T11:00:00.000Z`,
        },
      ]
    );

    expect(report).toContain('Alex Rivera');
    expect(report).toContain('Startup Ideas');
    expect(report).toContain('Total Thoughts Planted: 4');
    expect(report).toContain('Love the zen feel');
  });
});
