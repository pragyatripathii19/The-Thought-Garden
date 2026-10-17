/** Error from the Thought Garden server, carrying the HTTP status. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Fired when the server says the session is gone, so the app can show the login screen. */
export const SESSION_EXPIRED_EVENT = 'thought-garden:session-expired';

/**
 * Calls the server's JSON API with the session cookie. Throws ApiError with the
 * server's message on failure, or a friendly message when the server is unreachable.
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; signalExpiry?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, signalExpiry = true } = options;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      // Always JSON: the server refuses other content types on writes (CSRF guard).
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the garden server. Check your connection and try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Empty or non-JSON body.
  }

  if (!res.ok) {
    if (res.status === 401 && signalExpiry && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `The server returned an error (HTTP ${res.status}).`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}
