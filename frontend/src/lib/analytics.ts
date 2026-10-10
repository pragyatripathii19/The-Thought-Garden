import { Thought, PilotUserProfile, PilotFeedback } from '../types';

export interface DailyThoughtMetric {
  date: string;
  count: number;
  label: string; // e.g. "Mon 10"
}

/**
 * Groups thoughts by YYYY-MM-DD for the last N days (default 14).
 */
export function computeThoughtsPerDay(thoughts: Thought[], days = 14): DailyThoughtMetric[] {
  const result: DailyThoughtMetric[] = [];
  const map: Record<string, number> = {};

  // Count by date string
  for (const t of thoughts) {
    if (!t.createdAt) continue;
    const dateStr = t.createdAt.slice(0, 10);
    map[dateStr] = (map[dateStr] || 0) + 1;
  }

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
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
    thoughts.map((t) => t.createdAt.slice(0, 10)).filter(Boolean)
  );

  let streak = 0;
  const current = new Date();
  const todayStr = current.toISOString().slice(0, 10);

  // If active today, start from today, else start from yesterday
  if (datesSet.has(todayStr)) {
    streak = 1;
    current.setDate(current.getDate() - 1);
  } else {
    // Check if planted yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (datesSet.has(yStr)) {
      streak = 1;
      current.setDate(current.getDate() - 2);
    } else {
      return 0;
    }
  }

  while (true) {
    const dStr = current.toISOString().slice(0, 10);
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
  const todayStr = new Date().toISOString().slice(0, 10);
  return thoughts.filter((t) => t.createdAt && t.createdAt.startsWith(todayStr)).length;
}

/**
 * Generates formatted diagnostic Markdown summary.
 */
export function generatePilotSummaryReport(
  profile: PilotUserProfile | null,
  thoughts: Thought[],
  feedbacks: PilotFeedback[]
): string {
  const todayCount = computeTodayThoughtsCount(thoughts);
  const streak = computeGardenStreak(thoughts);
  const dailyMetrics = computeThoughtsPerDay(thoughts, 7);

  const report = [
    `# The Thought Garden — Pilot Diagnostic Summary`,
    `Generated at: ${new Date().toLocaleString()}`,
    ``,
    `## User Profile`,
    `- Name: ${profile?.name || 'Anonymous Gardener'}`,
    `- Email: ${profile?.email || 'None provided'}`,
    `- Goals / Intent: ${profile?.reasons?.join(', ') || 'General Note Taking'}`,
    `- Joined: ${profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}`,
    ``,
    `## Engagement & Usage Metrics`,
    `- Total Thoughts Planted: ${thoughts.length}`,
    `- Thoughts Planted Today: ${todayCount}`,
    `- Active Streak: ${streak} day${streak === 1 ? '' : 's'}`,
    ``,
    `## Recent 7-Day Activity`,
    ...dailyMetrics.map((m) => `- ${m.label} (${m.date}): ${m.count} thought${m.count === 1 ? '' : 's'}`),
    ``,
    `## Feedback Submissions (${feedbacks.length})`,
    feedbacks.length === 0
      ? `*(No feedback submitted yet)*`
      : feedbacks
          .map(
            (fb, idx) =>
              `### ${idx + 1}. [${fb.category.toUpperCase()}] Rating: ${'🌿'.repeat(fb.rating)}\n` +
              `> ${fb.message}\n` +
              `*Submitted on ${new Date(fb.createdAt).toLocaleString()}*`
          )
          .join('\n\n'),
  ].join('\n');

  return report;
}
