import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from './time';

describe('formatRelativeTime', () => {
  const baseTime = new Date('2026-10-10T12:00:00Z').getTime();

  it('formats recent events as "Just now"', () => {
    const justNow = new Date(baseTime - 30 * 1000).toISOString();
    expect(formatRelativeTime(justNow, baseTime)).toBe('Just now');
  });

  it('formats minutes as "Xm ago"', () => {
    const minutesAgo = new Date(baseTime - 25 * 60 * 1000).toISOString();
    expect(formatRelativeTime(minutesAgo, baseTime)).toBe('25m ago');
  });

  it('formats hours as "Xh ago"', () => {
    const twoHoursAgo = new Date(baseTime - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoHoursAgo, baseTime)).toBe('2h ago');

    const fourHoursAgo = new Date(baseTime - 4 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fourHoursAgo, baseTime)).toBe('4h ago');
  });

  it('formats days as "Xd ago"', () => {
    const oneDayAgo = new Date(baseTime - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneDayAgo, baseTime)).toBe('1d ago');

    const threeDaysAgo = new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo, baseTime)).toBe('3d ago');
  });

  it('handles invalid timestamp gracefully', () => {
    expect(formatRelativeTime('invalid-date')).toBe('invalid-date');
  });
});
