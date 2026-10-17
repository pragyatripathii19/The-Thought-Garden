import { ApiError } from '../api';

/**
 * Why Smart organising is temporarily not being used. While paused, thoughts
 * are organised with the on-device rule instead.
 */
export type SmartPauseReason = 'rate-limited' | 'unavailable' | 'error';

export interface SmartPause {
  reason: SmartPauseReason;
  /** Epoch ms when Smart organising may be tried again. */
  until: number;
}

const BASE_ERROR_PAUSE_MS = 30 * 1000;
const MAX_PAUSE_MS = 10 * 60 * 1000;
const UNAVAILABLE_PAUSE_MS = 10 * 60 * 1000;
const DEFAULT_RATE_LIMIT_PAUSE_MS = 60 * 1000;

/**
 * Decides how long to stop calling the AI after a failed request.
 * `consecutiveErrors` counts failures in a row, including this one.
 * Returns null when the failure needs no pause (e.g. a bad request about one thought).
 */
export function smartPauseAfter(err: unknown, consecutiveErrors: number, now = Date.now()): SmartPause | null {
  const status = err instanceof ApiError ? err.status : 0;

  if (status === 429) {
    const ms = err instanceof ApiError && err.retryAfterSeconds ? err.retryAfterSeconds * 1000 : DEFAULT_RATE_LIMIT_PAUSE_MS;
    return { reason: 'rate-limited', until: now + Math.min(ms, MAX_PAUSE_MS) };
  }
  // 503: no AI service configured. 403: turned off for this account (e.g. on another device).
  if (status === 503 || status === 403) {
    return { reason: 'unavailable', until: now + UNAVAILABLE_PAUSE_MS };
  }
  // 400 is about this one request; 401 is handled by signing the user out.
  if (status === 400 || status === 401) return null;

  // Network failures, timeouts, provider errors (502/504), anything else: back off exponentially.
  const ms = Math.min(BASE_ERROR_PAUSE_MS * 2 ** Math.max(0, consecutiveErrors - 1), MAX_PAUSE_MS);
  return { reason: 'error', until: now + ms };
}
