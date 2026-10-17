const express = require('express');
const { requireUser } = require('../auth.cjs');
const { createSlidingLimiter } = require('../rateLimit.cjs');

const clip = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

const CLASSIFY_SYSTEM_PROMPT = [
  'You help organise a person\'s private notes ("thoughts") into collections.',
  'Decide what to do with the NEW thought only. Choose exactly one action:',
  '- "assign": the new thought genuinely fits 1 or 2 EXISTING collections from the list. Use their ids.',
  '- "create": the new thought and exactly ONE similar thought marked "ungrouped": true share a meaningful theme',
  '  (an idea, project or question — not just a shared word). Give a concise 2-4 word name and a one-line description.',
  '- "none": no clear fit. This is the default. When unsure, choose "none".',
  'Rules: never merge, rename or delete collections; never invent ids; prefer an existing collection over creating one;',
  'never create a collection with a name that already exists.',
  'Reply with JSON only, in this shape:',
  '{"action":"assign"|"create"|"none","collectionIds":["..."],',
  '"newCollection":{"name":"...","description":"...","partnerThoughtId":"..."},"reason":"one short sentence"}',
].join('\n');

/**
 * Smart organising: classify a new thought against its retrieved candidates.
 * Stateless — thought text is forwarded to the LLM and never stored or logged here.
 */
function classifyRoutes({ config }) {
  const router = express.Router();
  const { llm } = config;
  const limiter = createSlidingLimiter({ max: llm.rateLimit, windowMs: llm.rateWindowMs });

  router.post('/', requireUser, async (req, res) => {
    try {
      if (!llm.apiKey) {
        return res.status(503).json({ error: 'Smart organising is not configured on this server' });
      }
      const { thought, similarThoughts, collections } = req.body || {};
      if (!thought || typeof thought.id !== 'string' || typeof thought.text !== 'string') {
        return res.status(400).json({ error: 'thought is required' });
      }
      if (!limiter.hit(req.user.id)) {
        return res.status(429).json({ error: 'Too many requests, try again shortly' });
      }

      const input = {
        newThought: { id: clip(thought.id, 100), text: clip(thought.text, 1000) },
        similarThoughts: (Array.isArray(similarThoughts) ? similarThoughts : []).slice(0, 10).map((t) => ({
          id: clip(t && t.id, 100),
          text: clip(t && t.text, 1000),
          collections: (Array.isArray(t && t.collections) ? t.collections : []).slice(0, 10).map((c) => clip(c, 80)),
          ungrouped: Boolean(t && t.ungrouped),
          similarity: Number(t && t.similarity) || 0,
        })),
        collections: (Array.isArray(collections) ? collections : []).slice(0, 40).map((c) => ({
          id: clip(c && c.id, 100),
          name: clip(c && c.name, 80),
          description: clip(c && c.description, 200),
          similarity: c && typeof c.similarity === 'number' ? c.similarity : null,
        })),
      };

      const llmRes = await fetch(`${llm.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llm.apiKey}` },
        body: JSON.stringify({
          model: llm.model,
          temperature: 0,
          max_tokens: 300,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(input) },
          ],
        }),
        signal: AbortSignal.timeout(llm.timeoutMs),
      });

      if (!llmRes.ok) {
        console.error(`Classify: LLM provider returned HTTP ${llmRes.status}`);
        return res.status(502).json({ error: 'Classification provider error' });
      }

      const data = await llmRes.json();
      const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      let decision;
      try {
        decision = JSON.parse(content);
      } catch {
        return res.status(502).json({ error: 'Classification provider returned invalid JSON' });
      }
      if (!decision || !['assign', 'create', 'none'].includes(decision.action)) {
        return res.status(502).json({ error: 'Classification provider returned an unknown action' });
      }

      // The client validates ids and names against its own data before applying anything.
      res.json({ ok: true, decision });
    } catch (err) {
      // Log only the error type — never the request body.
      console.error('Classify failed:', err && err.name ? err.name : 'Error');
      res.status(502).json({ error: 'Classification failed' });
    }
  });

  return router;
}

module.exports = { classifyRoutes };
