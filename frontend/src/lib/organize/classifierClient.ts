import { ClassifyPayload } from './organizer';
import { apiFetch } from '../api';

const API_BASE = '/api';
// A little longer than the server's own 15s wait for the provider.
const CLASSIFY_TIMEOUT_MS = 20000;

/**
 * Asks the server whether Smart organising is configured (an LLM key is set).
 * Returns false when the backend is unreachable.
 */
export async function fetchSmartOrganizingAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.smartOrganizing);
  } catch {
    return false;
  }
}

/**
 * Sends a thought and its retrieved candidates to the server, which forwards
 * them to the configured LLM. Only called when the user enabled Smart organising.
 * Returns the raw (untrusted) decision; validate before applying.
 */
export async function requestClassification(payload: ClassifyPayload): Promise<unknown> {
  // A slow AI answer shouldn't hold up the queue; the caller falls back to on-device organising.
  const data = await apiFetch<{ decision: unknown }>('/classify', {
    method: 'POST',
    body: payload,
    timeoutMs: CLASSIFY_TIMEOUT_MS,
  });
  return data.decision;
}
