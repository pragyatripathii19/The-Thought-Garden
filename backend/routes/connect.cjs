const express = require('express');
const { requireUser } = require('../auth.cjs');
const { createSlidingLimiter } = require('../rateLimit.cjs');
const { sendLlmError } = require('../llm.cjs');

const clip = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

const KINDS = ['same-subject', 'shared-theme', 'different-feelings', 'builds-on'];
const TONES = ['positive', 'negative', 'neutral', 'mixed'];
const MAX_THOUGHTS = 4;
const MAX_CANDIDATES = 5;
const MAX_TEXT = 600;

const CONNECT_SYSTEM_PROMPT = [
  'You find meaningful links between a person\'s private notes ("thoughts").',
  'You get numbered pairs of thoughts, "a" and "b". Give a verdict for EVERY pair.',
  'Judge by meaning, never by shared words. A pair is connected when both share a SPECIFIC subject:',
  '- the same thing in different words (car / vehicle, thesis / dissertation);',
  '- one specific theme seen from two sides (elections / registering to vote, retirement / index funds);',
  '- different feelings or opinions about the same subject (loving vs. hating working from home);',
  '- one develops, answers or acts on the other (an idea and a first step towards it).',
  'Test: name what both are about in 1-4 specific words that the person would recognise at once.',
  'If the only thing they share is a broad area of life — well-being, health, habits, stress, worries, mood,',
  'family, friends, work, money, food, shopping, productivity, mornings, creativity, technology — they are NOT',
  'connected. Nor are the same word with another meaning (bank holiday / savings bank), or only the same time,',
  'place or format (both "this weekend").',
  'Not connected, for example: a gym plan and a salad recipe (only "health"); buying printer ink and buying shoes',
  '(only "shopping"); morning meditation and the morning commute (only "mornings"); a birthday gift for dad and',
  'dad\'s new job (only "dad"); a podcast idea and a blog idea (only "creative projects").',
  'Connected, for example: a podcast idea and "record a test episode" (builds on it); dad\'s surgery and',
  '"worried about dad\'s recovery" (same subject).',
  'For each pair give:',
  '- "pair": its number;',
  '- "toneA" and "toneB": how each thought feels — "positive", "negative", "neutral" or "mixed";',
  '- "kind": "none" (not connected), "same-subject" (the same specific thing), "shared-theme" (different',
  '  things under one specific theme), "different-feelings" (same subject, contrasting feelings or views) or',
  '  "builds-on" (one develops, answers or acts on the other);',
  'and, unless kind is "none":',
  '- "subject": what they share, 1-4 lowercase words, e.g. "working from home" or "elections and voting";',
  '- "reason": one short, warm sentence (at most 20 words) to the person, saying accurately what a and b are',
  '  each about, without quoting them, e.g. "Both are about voting: one on the elections, one on registering in time.";',
  '- "strength": "clear" when a person would agree at once, "loose" when it takes some stretching.',
  'Reply with JSON only, in this shape:',
  '{"verdicts":[{"pair":1,"toneA":"...","toneB":"...","kind":"...","subject":"...","reason":"...","strength":"clear"}]}',
].join('\n');

/** Opposite feelings about the same subject, decided from the tones rather than left to the model. */
function kindFor(verdict) {
  const tones = [verdict.toneA, verdict.toneB];
  const opposite = tones.includes('positive') && tones.includes('negative');
  if (opposite && (verdict.kind === 'same-subject' || verdict.kind === 'shared-theme')) return 'different-feelings';
  return verdict.kind;
}

/** Unordered pairs to ask about, from each thought's candidates. */
function pairsFrom(thoughts) {
  const seen = new Set();
  const pairs = [];
  for (const t of thoughts) {
    for (const c of t.candidates) {
      if (!t.id || !c.id || t.id === c.id) continue;
      const key = [t.id, c.id].sort().join('\u0000');
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ thoughtId: t.id, candidateId: c.id, a: t.text, b: c.text });
    }
  }
  return pairs;
}

/** Turns the AI's verdicts into clear, well-formed links between the pairs that were asked about. */
function validLinks(raw, pairs) {
  const list = raw && Array.isArray(raw.verdicts) ? raw.verdicts : [];
  const done = new Set();
  const links = [];
  for (const v of list) {
    if (!v || typeof v !== 'object') continue;
    const index = Number(v.pair) - 1;
    const pair = pairs[index];
    if (!pair || done.has(index)) continue;
    done.add(index);
    if (!KINDS.includes(v.kind)) continue; // "none" and anything unknown
    // Only links a person would agree with at once are suggested.
    if (v.strength !== 'clear') continue;
    const subject = clip(v.subject, 60).trim().toLowerCase();
    const reason = clip(v.reason, 200).trim();
    if (!subject || !reason) continue;
    const tones = { toneA: TONES.includes(v.toneA) ? v.toneA : null, toneB: TONES.includes(v.toneB) ? v.toneB : null };
    links.push({ thoughtId: pair.thoughtId, candidateId: pair.candidateId, kind: kindFor({ ...v, ...tones }), subject, reason });
  }
  return links;
}

/**
 * Connections by meaning: the browser finds likely pairs on the device and asks the
 * AI which are really connected, how, and why. Stateless like /api/classify — thought
 * text is forwarded to the LLM and never stored or logged here. Same failure statuses.
 */
function connectRoutes({ config, llmClient }) {
  const router = express.Router();
  const { llm } = config;
  const limiter = createSlidingLimiter({ max: llm.connectRateLimit, windowMs: llm.rateWindowMs });

  const rateLimited = (res, seconds, error) =>
    res.status(429).set('Retry-After', String(seconds)).json({ error, retryAfterSeconds: seconds });

  router.post('/', requireUser, async (req, res) => {
    try {
      if (!llm.apiKey) {
        return res.status(503).json({ error: 'Smart organising is not configured on this server' });
      }
      if (req.user.smart_organizing === false) {
        return res.status(403).json({ error: 'Smart organising is turned off for this account' });
      }
      const body = req.body || {};
      if (!Array.isArray(body.thoughts) || body.thoughts.length === 0) {
        return res.status(400).json({ error: 'thoughts are required' });
      }

      const pairs = pairsFrom(
        body.thoughts.slice(0, MAX_THOUGHTS).map((t) => ({
          id: clip(t && t.id, 100),
          text: clip(t && t.text, MAX_TEXT),
          candidates: (Array.isArray(t && t.candidates) ? t.candidates : []).slice(0, MAX_CANDIDATES).map((c) => ({
            id: clip(c && c.id, 100),
            text: clip(c && c.text, MAX_TEXT),
          })),
        }))
      );
      if (pairs.length === 0) return res.json({ ok: true, connections: [] });

      const pausedFor = llmClient.pausedFor();
      if (pausedFor > 0) {
        return rateLimited(res, pausedFor, 'The AI service is busy, try again shortly');
      }
      if (!limiter.hit(req.user.id)) {
        return rateLimited(res, Math.ceil(llm.rateWindowMs / 1000), 'Too many requests, try again shortly');
      }

      const raw = await llmClient.chatJson({
        system: CONNECT_SYSTEM_PROMPT,
        // Only numbered texts are sent: no ids for the model to mix up.
        input: { pairs: pairs.map((p, i) => ({ pair: i + 1, a: p.a, b: p.b })) },
        model: llm.connectModel,
        maxTokens: llm.connectMaxTokens,
        timeoutMs: llm.connectTimeoutMs,
        label: 'Connect',
      });
      res.json({ ok: true, connections: validLinks(raw, pairs) });
    } catch (err) {
      sendLlmError(res, err, 'Connection finding');
    }
  });

  return router;
}

module.exports = { connectRoutes, pairsFrom, validLinks, CONNECT_SYSTEM_PROMPT };
