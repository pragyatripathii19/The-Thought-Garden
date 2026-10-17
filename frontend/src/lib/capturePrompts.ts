import { splitReasons } from './profileReasons';

export const DEFAULT_CAPTURE_PROMPT = 'What’s on your mind?';

// Gentle prompts for the capture box, by why the person is here.
const PROMPTS: Record<string, string[]> = {
  'brain-dump': ['Empty your head here…', 'What’s taking up space in your mind?'],
  'startup-ideas': ['An idea worth building?', 'What problem caught your eye today?'],
  writing: ['A line, a draft, a story idea…', 'What do you want to write about?'],
  research: ['A question you want to explore?', 'Something you want to understand better?'],
  tasks: ['Something to follow up on?', 'What shouldn’t slip through the cracks?'],
  mindfulness: ['How are you feeling today?', 'What did you notice today?'],
};

/** All prompts for someone's reasons, always including the plain default. */
export function capturePrompts(reasons: string[] = []): string[] {
  const { ids, custom } = splitReasons(reasons);
  const prompts = [DEFAULT_CAPTURE_PROMPT, ...ids.flatMap((id) => PROMPTS[id] || [])];
  if (custom) {
    const topic = custom.replace(/[.!?…]+$/, '');
    prompts.push(`A thought about ${topic.charAt(0).toLowerCase()}${topic.slice(1)}?`);
  }
  return prompts;
}

/** One prompt, chosen by a counter so it can rotate (e.g. after each planted thought). */
export function pickCapturePrompt(reasons: string[] | undefined, counter: number): string {
  const prompts = capturePrompts(reasons);
  return prompts[Math.abs(Math.floor(counter)) % prompts.length];
}
