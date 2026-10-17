import { describe, it, expect } from 'vitest';
import { describeReason, joinReasons, normalizeReason, splitReasons, CUSTOM_REASON_MAX } from './profileReasons';
import { capturePrompts, pickCapturePrompt, DEFAULT_CAPTURE_PROMPT } from './capturePrompts';

describe('profile reasons', () => {
  it('reads answers saved before ids existed (emoji-prefixed labels)', () => {
    expect(normalizeReason('\u{1F331} Daily Brain Dump')).toBe('brain-dump');
    expect(normalizeReason('\u{1F4A1} Startup & Project Ideas')).toBe('startup-ideas');
    expect(normalizeReason('\u{270D}\u{FE0F} Writing & Journaling')).toBe('writing');
    expect(normalizeReason('\u{1F4DA} Study & Deep Research')).toBe('research');
    expect(normalizeReason('\u{1F4CB} Tasks & Follow-ups')).toBe('tasks');
    expect(normalizeReason('✨ Mindful Reflection')).toBe('mindfulness');
  });

  it('keeps free text as free text, even when it mentions a preset word', () => {
    expect(normalizeReason('writing a novel')).toBe('writing a novel');
    expect(normalizeReason('book notes')).toBe('book notes');
  });

  it('splits and joins ids and the free-text answer', () => {
    expect(splitReasons(['writing', 'book notes', 'tasks'])).toEqual({ ids: ['writing', 'tasks'], custom: 'book notes' });
    expect(splitReasons(['\u{1F331} Daily Brain Dump', 'brain-dump'])).toEqual({ ids: ['brain-dump'], custom: '' });
    expect(joinReasons(['writing'], '  book notes  ')).toEqual(['writing', 'book notes']);
    expect(joinReasons([], '   ')).toEqual([]);
    expect(joinReasons([], 'x'.repeat(100))[0]).toHaveLength(CUSTOM_REASON_MAX);
  });

  it('describes reasons with a readable label', () => {
    expect(describeReason('writing').label).toBe('Writing & journaling');
    expect(describeReason('\u{1F331} Daily Brain Dump').label).toBe('Daily brain dump');
    expect(describeReason('book notes').label).toBe('book notes');
  });
});

describe('capture prompts', () => {
  it('falls back to the plain prompt when no reasons are given', () => {
    expect(capturePrompts([])).toEqual([DEFAULT_CAPTURE_PROMPT]);
    expect(pickCapturePrompt(undefined, 7)).toBe(DEFAULT_CAPTURE_PROMPT);
  });

  it('adds prompts for each reason and one for the free-text answer', () => {
    const prompts = capturePrompts(['writing', 'Book notes.']);
    expect(prompts).toContain('A line, a draft, a story idea…');
    expect(prompts).toContain('A thought about book notes?');
    expect(prompts[0]).toBe(DEFAULT_CAPTURE_PROMPT);
  });

  it('rotates through the prompts with the counter', () => {
    const all = capturePrompts(['mindfulness']);
    const seen = new Set(all.map((_, i) => pickCapturePrompt(['mindfulness'], i)));
    expect(seen.size).toBe(all.length);
    expect(pickCapturePrompt(['mindfulness'], all.length)).toBe(pickCapturePrompt(['mindfulness'], 0));
  });
});
