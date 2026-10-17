// Server configuration, read once from the environment (see .env.example).

const isProduction = process.env.NODE_ENV === 'production';
const model = process.env.LLM_MODEL || 'openai/gpt-oss-20b';

const config = {
  isProduction,
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || '',
  // Neon: the app uses the pooled DATABASE_URL; migrations need a direct
  // (unpooled) connection, so they use this one when it's set.
  migrationDatabaseUrl: process.env.DATABASE_URL_UNPOOLED || '',

  // Comma-separated emails that get the admin dashboard.
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  session: {
    cookieName: 'tg_session',
    maxAgeMs: 30 * 24 * 60 * 60 * 1000,
    // Sessions used after this much of their life has passed are extended.
    renewAfterMs: 15 * 24 * 60 * 60 * 1000,
    secureCookie: isProduction,
  },

  login: {
    maxFailuresPerEmail: 10,
    maxFailuresPerIp: 30,
    failureWindowMs: 15 * 60 * 1000,
  },

  // Smart organising: any OpenAI-compatible chat completions API (Groq by default).
  llm: {
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
    apiKey: process.env.LLM_API_KEY || '',
    model,
    // Reasoning models (e.g. gpt-oss) need a low effort so their reasoning doesn't use up
    // the output budget before the JSON answer. Only sent when set.
    reasoningEffort: process.env.LLM_REASONING_EFFORT ?? (model.includes('gpt-oss') ? 'low' : ''),
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 600,
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || 15000,
    rateLimit: Number(process.env.CLASSIFY_RATE_LIMIT) || 10, // requests per user per minute
    rateWindowMs: 60 * 1000,
  },
};

module.exports = { config };
