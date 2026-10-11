import { ClassifyPayload } from './organizer';

const API_BASE = '/api';

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
export async function requestClassification(userId: string, payload: ClassifyPayload): Promise<unknown> {
  const res = await fetch(`${API_BASE}/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...payload }),
  });
  if (!res.ok) {
    throw new Error(`Classification request failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.decision;
}
