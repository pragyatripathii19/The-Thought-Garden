export interface OrganizerSettings {
  /** Local, on-device organising (embeddings + local rule). */
  autoOrganize: boolean;
  /** Opt-in: send new thoughts to an LLM via our server for better decisions and names. */
  smartOrganizing: boolean;
  smartConsentAt?: string;
}

export const DEFAULT_ORGANIZER_SETTINGS: OrganizerSettings = {
  autoOrganize: true,
  smartOrganizing: false,
};

const SETTINGS_KEY = 'thought_garden_organizer_settings';
const SUGGESTIONS_KEY = 'thought_garden_group_suggestions';

export const ORGANIZER_STORAGE_KEYS = [SETTINGS_KEY, SUGGESTIONS_KEY];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: settings simply won't persist.
  }
}

export function loadOrganizerSettings(): OrganizerSettings {
  return { ...DEFAULT_ORGANIZER_SETTINGS, ...readJson<Partial<OrganizerSettings>>(SETTINGS_KEY, {}) };
}

export function saveOrganizerSettings(settings: OrganizerSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function loadGroupSuggestions<T>(): T[] {
  return readJson<T[]>(SUGGESTIONS_KEY, []);
}

export function saveGroupSuggestions<T>(suggestions: T[]): void {
  writeJson(SUGGESTIONS_KEY, suggestions);
}
