import { Brain, GraduationCap, Lightbulb, ListChecks, LucideIcon, PenLine, Sparkles, Sprout } from 'lucide-react';

/**
 * "Why are you growing a garden?" choices. Ids are what's saved on the account
 * and must match backend/starterCollections.cjs. Anything else saved in
 * `reasons` is the person's own free-text answer.
 */
export const REASON_OPTIONS: { id: string; label: string; desc: string; Icon: LucideIcon }[] = [
  { id: 'brain-dump', label: 'Daily brain dump', desc: 'Clear mental clutter', Icon: Brain },
  { id: 'startup-ideas', label: 'Startup & project ideas', desc: 'Nurture creative concepts', Icon: Lightbulb },
  { id: 'writing', label: 'Writing & journaling', desc: 'Draft essays & thoughts', Icon: PenLine },
  { id: 'research', label: 'Study & research', desc: 'Collect knowledge & links', Icon: GraduationCap },
  { id: 'tasks', label: 'Tasks & follow-ups', desc: 'Keep track of actionable notes', Icon: ListChecks },
  { id: 'mindfulness', label: 'Mindful reflection', desc: 'A calm thinking space', Icon: Sparkles },
];

export const CUSTOM_REASON_MAX = 60;
const CUSTOM_ICON: LucideIcon = Sprout;

const BY_ID = new Map(REASON_OPTIONS.map((o) => [o.id, o]));

// Answers saved before ids existed were labels with an emoji prefix, e.g. "<seedling emoji> Daily Brain Dump".
const LEGACY: [RegExp, string][] = [
  [/brain dump/i, 'brain-dump'],
  [/startup|project ideas/i, 'startup-ideas'],
  [/writing|journaling/i, 'writing'],
  [/study|research/i, 'research'],
  [/tasks|follow-ups/i, 'tasks'],
  [/mindful|reflection/i, 'mindfulness'],
];

/** A saved reason as an id when it is (or was once labelled as) one of the options. */
export function normalizeReason(reason: string): string {
  const r = reason.trim();
  if (BY_ID.has(r)) return r;
  // Only old preset labels carried an emoji prefix; free text never did.
  if (/^[^\p{L}\p{N}]+\s/u.test(r)) {
    const legacy = LEGACY.find(([pattern]) => pattern.test(r));
    if (legacy) return legacy[1];
  }
  return r;
}

/** Splits saved reasons into option ids and the free-text answer (if any). */
export function splitReasons(reasons: string[] = []): { ids: string[]; custom: string } {
  const ids: string[] = [];
  let custom = '';
  for (const raw of reasons) {
    const r = normalizeReason(raw);
    if (BY_ID.has(r)) {
      if (!ids.includes(r)) ids.push(r);
    } else if (r && !custom) {
      custom = r.slice(0, CUSTOM_REASON_MAX);
    }
  }
  return { ids, custom };
}

/** Saved form: option ids followed by the free-text answer. */
export function joinReasons(ids: string[], custom: string): string[] {
  const text = custom.trim().slice(0, CUSTOM_REASON_MAX);
  return [...ids, ...(text ? [text] : [])];
}

/** Label and icon for showing a saved reason. */
export function describeReason(reason: string): { label: string; Icon: LucideIcon } {
  const option = BY_ID.get(normalizeReason(reason));
  return option ? { label: option.label, Icon: option.Icon } : { label: reason, Icon: CUSTOM_ICON };
}
