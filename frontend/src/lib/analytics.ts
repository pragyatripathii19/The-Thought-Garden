import { Thought, AdminOverviewData } from '../types';
import { describeReason } from './profileReasons';
import { localDateKey } from './date';

export interface DailyThoughtMetric {
  date: string;
  count: number;
  label: string; // e.g. "Mon 10"
}

/**
 * Groups thoughts by local calendar day (YYYY-MM-DD) for the last N days (default 14).
 */
export function computeThoughtsPerDay(thoughts: Thought[], days = 14): DailyThoughtMetric[] {
  const result: DailyThoughtMetric[] = [];
  const map: Record<string, number> = {};

  // Count by date string
  for (const t of thoughts) {
    if (!t.createdAt) continue;
    const dateStr = localDateKey(t.createdAt);
    map[dateStr] = (map[dateStr] || 0) + 1;
  }

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = localDateKey(d);
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    result.push({
      date: dateStr,
      count: map[dateStr] || 0,
      label,
    });
  }

  return result;
}

/**
 * Calculates current consecutive active day streak based on thought timestamps.
 */
export function computeGardenStreak(thoughts: Thought[]): number {
  if (!thoughts || thoughts.length === 0) return 0;

  const datesSet = new Set(
    thoughts.filter((t) => t.createdAt).map((t) => localDateKey(t.createdAt))
  );

  let streak = 0;
  const current = new Date();
  const todayStr = localDateKey(current);

  // If active today, start from today, else start from yesterday
  if (datesSet.has(todayStr)) {
    streak = 1;
    current.setDate(current.getDate() - 1);
  } else {
    // Check if planted yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = localDateKey(yesterday);
    if (datesSet.has(yStr)) {
      streak = 1;
      current.setDate(current.getDate() - 2);
    } else {
      return 0;
    }
  }

  while (true) {
    const dStr = localDateKey(current);
    if (datesSet.has(dStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Counts thoughts created today.
 */
export function computeTodayThoughtsCount(thoughts: Thought[]): number {
  const todayStr = localDateKey();
  return thoughts.filter((t) => t.createdAt && localDateKey(t.createdAt) === todayStr).length;
}

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');

/**
 * A plain-text (Markdown) summary of the whole pilot, from the admin overview.
 * Counts only: like the dashboard, it never includes thought text.
 */
export function generateAdminSummaryReport(data: AdminOverviewData, now = new Date()): string {
  const { summary: s, organizing: o, features: f } = data;
  const people = data.users.map((u) => {
    const reasons = u.reasons.map((r) => describeReason(r).label).join(', ') || 'no reasons given';
    return (
      `- ${u.name}${u.isAdmin ? ' (admin)' : ''}: ${u.totalThoughts} thoughts (${u.thoughtsThisWeek} this week), ` +
      `active ${u.daysActive30} of the last 30 days, last seen ${new Date(u.lastActiveAt).toLocaleDateString()}; ${reasons}`
    );
  });
  const feedback = data.feedback.map(
    (fb, i) =>
      `### ${i + 1}. [${fb.category.toUpperCase()}] Rating: ${fb.rating}/5 (${fb.userName || 'Anonymous'})\n` +
      `> ${fb.message}\n` +
      `*Submitted on ${new Date(fb.createdAt).toLocaleString()}*`
  );

  return [
    `# The Thought Garden — Pilot Summary`,
    `Generated ${now.toLocaleString()} (days counted in ${data.timeZone})`,
    ``,
    `## Overview`,
    `- People: ${s.totalUsers} (${s.admins} admin${s.admins === 1 ? '' : 's'})`,
    `- Active this week: ${s.activeThisWeek} of ${s.totalUsers}; today: ${s.activeToday}`,
    `- Thoughts this week: ${s.thoughtsThisWeek}; all time: ${s.totalThoughtsLogged}`,
    `- Feedback messages: ${s.totalFeedback}`,
    ``,
    `## Organising`,
    `- Automatic actions: ${o.actions}, undone: ${o.undone} (${pct(o.undone, o.actions)})`,
    `- AI (Smart organising): ${o.llm.actions} actions, ${pct(o.llm.undone, o.llm.actions)} undone`,
    `- On-device: ${o.onDevice.actions} actions, ${pct(o.onDevice.undone, o.onDevice.actions)} undone`,
    `- Smart organising on for ${o.smartOrganizingOn} of ${s.totalUsers} people`,
    ``,
    `## Features used`,
    `- Collections: ${f.collectionsMade} made by people, ${f.collectionsAuto} created automatically`,
    `- Accepted connections: ${f.connections}`,
    `- Saved: ${f.savedThoughts} thoughts, ${f.savedCollections} collections`,
    `- Stages: ${f.stages.seed} seed, ${f.stages.sprout} sprout, ${f.stages.bloom} bloom, ${f.stages.mature} mature`,
    ``,
    `## People`,
    ...(people.length ? people : ['*(No accounts yet)*']),
    ``,
    `## Feedback (${data.feedback.length})`,
    feedback.length ? feedback.join('\n\n') : '*(No feedback submitted yet)*',
  ].join('\n');
}
