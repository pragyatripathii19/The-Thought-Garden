/** Error from the Thought Garden server, carrying the HTTP status. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Set on 429 responses: how long the server asks us to wait. */
    public retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Status used for requests that gave up waiting (no HTTP response). */
export const TIMEOUT_STATUS = 408;

/** Fired when the server says the session is gone, so the app can show the login screen. */
export const SESSION_EXPIRED_EVENT = 'thought-garden:session-expired';

/**
 * Calls the server's JSON API with the session cookie. Throws ApiError with the
 * server's message on failure, or a friendly message when the server is unreachable.
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; signalExpiry?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { method = 'GET', body, signalExpiry = true, timeoutMs } = options;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      // Always JSON: the server refuses other content types on writes (CSRF guard).
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new ApiError(TIMEOUT_STATUS, 'The garden server took too long to answer.');
    }
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
    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const message =
      typeof record.error === 'string' ? record.error : `The server returned an error (HTTP ${res.status}).`;
    const retryAfter =
      typeof record.retryAfterSeconds === 'number'
        ? record.retryAfterSeconds
        : Number(res.headers.get('Retry-After')) || undefined;
    throw new ApiError(res.status, message, retryAfter);
  }
  return data as T;
}
