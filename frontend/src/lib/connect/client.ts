import { apiFetch } from '../api';

// Longer than classify: up to 20 pairs are judged at once, by a larger model.
const CONNECT_TIMEOUT_MS = 30000;

export interface ConnectRequestThought {
  id: string;
  text: string;
  candidates: { id: string; text: string }[];
}

/**
 * Asks the server which candidates are really connected to each thought. Only called with
 * Smart organising on. Returns the raw (untrusted) links; check them with linksFromAi.
 */
export async function requestConnections(thoughts: ConnectRequestThought[]): Promise<unknown> {
  const data = await apiFetch<{ connections: unknown }>('/connect', {
    method: 'POST',
    body: { thoughts },
    timeoutMs: CONNECT_TIMEOUT_MS,
  });
  return data.connections;
}
