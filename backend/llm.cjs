// Shared client for the OpenAI-compatible LLM behind Smart organising and connections.
// Stateless: prompts are forwarded and never stored or logged here.

// When the provider rate-limits us without saying for how long.
const DEFAULT_PROVIDER_PAUSE_SECONDS = 30;
const MAX_PROVIDER_PAUSE_SECONDS = 10 * 60;

/** Seconds from a Retry-After header (seconds or HTTP date), clamped to a sane range. */
function retryAfterSeconds(header) {
  if (!header) return DEFAULT_PROVIDER_PAUSE_SECONDS;
  const seconds = Number(header);
  const value = Number.isFinite(seconds) ? seconds : (Date.parse(header) - Date.now()) / 1000;
  if (!Number.isFinite(value)) return DEFAULT_PROVIDER_PAUSE_SECONDS;
  return Math.min(MAX_PROVIDER_PAUSE_SECONDS, Math.max(1, Math.ceil(value)));
}

/** A failed LLM call. `kind` decides the HTTP status the route answers with. */
class LlmError extends Error {
  constructor(kind, message, retryAfter) {
    super(message);
    this.kind = kind; // 'ratelimit' | 'provider' | 'timeout'
    this.retryAfter = retryAfter;
  }
}

function createLlmClient(llm) {
  // One API key serves every user: when the provider rate-limits it, pause for everyone.
  let providerPausedUntil = 0;

  return {
    /** Seconds left in a provider-wide pause, or 0. */
    pausedFor() {
      return Math.max(0, Math.ceil((providerPausedUntil - Date.now()) / 1000));
    },

    /** Sends one system prompt and a JSON input; resolves with the parsed JSON answer. */
    async chatJson({ system, input, model = llm.model, maxTokens = llm.maxTokens, timeoutMs = llm.timeoutMs, label }) {
      let res;
      try {
        res = await fetch(`${llm.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llm.apiKey}` },
          body: JSON.stringify({
            model,
            temperature: 0,
            max_tokens: maxTokens,
            ...(llm.reasoningEffortFor(model) ? { reasoning_effort: llm.reasoningEffortFor(model) } : {}),
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: JSON.stringify(input) },
            ],
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (err) {
        const name = err && err.name ? err.name : 'Error';
        if (name === 'TimeoutError' || name === 'AbortError') throw new LlmError('timeout', 'The AI service took too long to answer');
        throw new LlmError('provider', `${label} failed`);
      }

      if (res.status === 429) {
        const seconds = retryAfterSeconds(res.headers.get('retry-after'));
        providerPausedUntil = Date.now() + seconds * 1000;
        console.warn(`${label}: provider rate limit, pausing AI requests for ${seconds}s`);
        throw new LlmError('ratelimit', 'The AI service is busy, try again shortly', seconds);
      }
      if (!res.ok) {
        console.error(`${label}: LLM provider returned HTTP ${res.status}`);
        throw new LlmError('provider', `${label} provider error`);
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new LlmError('provider', `${label} provider returned an unreadable response`);
      }
      const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch {
        throw new LlmError('provider', `${label} provider returned invalid JSON`);
      }
    },
  };
}

/** Answers a failed LLM call with the statuses the browser backs off on. */
function sendLlmError(res, err, label) {
  if (err instanceof LlmError) {
    if (err.kind === 'ratelimit') {
      return res.status(429).set('Retry-After', String(err.retryAfter)).json({ error: err.message, retryAfterSeconds: err.retryAfter });
    }
    if (err.kind === 'timeout') return res.status(504).json({ error: err.message });
    return res.status(502).json({ error: err.message });
  }
  // Log only the error type — never the request body.
  console.error(`${label} failed:`, err && err.name ? err.name : 'Error');
  return res.status(502).json({ error: `${label} failed` });
}

module.exports = { createLlmClient, sendLlmError, LlmError };
