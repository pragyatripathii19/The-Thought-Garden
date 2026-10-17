const express = require('express');
const { requireUser } = require('../auth.cjs');
const { withTransaction } = require('../db.cjs');
const garden = require('../garden.cjs');

const MAX_IMPORT_ITEMS = 20000;

/** Wraps an async handler so errors reach the error middleware. */
const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

function bodyMatchesParam(req, res) {
  if (!req.body || req.body.id !== req.params.id) {
    res.status(400).json({ error: 'The id in the URL and the body must match.' });
    return false;
  }
  return true;
}

function gardenRoutes({ pool }) {
  const router = express.Router();
  router.use(requireUser);
  const uid = (req) => req.user.id;

  // ---- thoughts ----
  router.get('/thoughts', handle(async (req, res) => {
    res.json({ thoughts: await garden.listThoughts(pool, uid(req)) });
  }));

  router.put('/thoughts/:id', handle(async (req, res) => {
    if (!bodyMatchesParam(req, res)) return;
    const parsed = garden.parseThought(req.body);
    const thought = await withTransaction(pool, (client) => garden.upsertThought(client, uid(req), parsed));
    res.json({ thought });
  }));

  router.delete('/thoughts/:id', handle(async (req, res) => {
    await withTransaction(pool, (client) => garden.deleteThought(client, uid(req), req.params.id));
    res.json({ ok: true });
  }));

  // ---- collections ----
  router.get('/collections', handle(async (req, res) => {
    res.json({ collections: await garden.listCollections(pool, uid(req)) });
  }));

  router.put('/collections/:id', handle(async (req, res) => {
    if (!bodyMatchesParam(req, res)) return;
    const collection = await garden.upsertCollection(pool, uid(req), garden.parseCollection(req.body));
    res.json({ collection });
  }));

  router.delete('/collections/:id', handle(async (req, res) => {
    await garden.deleteCollection(pool, uid(req), req.params.id);
    res.json({ ok: true });
  }));

  // ---- connections ----
  router.get('/connections', handle(async (req, res) => {
    res.json({ connections: await garden.listConnections(pool, uid(req)) });
  }));

  router.put('/connections/:id', handle(async (req, res) => {
    if (!bodyMatchesParam(req, res)) return;
    try {
      const connection = await garden.upsertConnection(pool, uid(req), garden.parseConnection(req.body));
      res.json({ connection });
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ error: 'These two thoughts already have a connection.' });
      }
      throw err;
    }
  }));

  router.delete('/connections/:id', handle(async (req, res) => {
    await garden.deleteConnection(pool, uid(req), req.params.id);
    res.json({ ok: true });
  }));

  // ---- organiser activity log ----
  router.get('/organize-events', handle(async (req, res) => {
    res.json({ events: await garden.listOrganizeEvents(pool, uid(req)) });
  }));

  router.put('/organize-events/:id', handle(async (req, res) => {
    if (!bodyMatchesParam(req, res)) return;
    const event = await garden.upsertOrganizeEvent(pool, uid(req), garden.parseOrganizeEvent(req.body));
    res.json({ event });
  }));

  // ---- clear one resource (used by "replace" flows and resets) ----
  for (const resource of ['thoughts', 'collections', 'connections', 'organize-events']) {
    router.delete(`/${resource}`, handle(async (req, res) => {
      await garden.clearAll(pool, uid(req), resource);
      res.json({ ok: true });
    }));
  }

  // ---- import a backup in one transaction ----
  router.post('/garden/import', handle(async (req, res) => {
    const { garden: data, strategy } = req.body || {};
    if (!data || !['merge', 'replace'].includes(strategy)) {
      return res.status(400).json({ error: 'Send a garden and a strategy of "merge" or "replace".' });
    }
    const lists = ['thoughts', 'collections', 'connections'].map((key) => data[key] || []);
    if (lists.some((l) => !Array.isArray(l) || l.length > MAX_IMPORT_ITEMS)) {
      return res.status(400).json({ error: 'The backup is malformed or too large.' });
    }
    const [thoughts, collections, connections] = [
      lists[0].map(garden.parseThought),
      lists[1].map(garden.parseCollection),
      lists[2].map(garden.parseConnection),
    ];

    const stats = await withTransaction(pool, async (client) => {
      const userId = uid(req);
      if (strategy === 'replace') {
        for (const resource of ['organize-events', 'connections', 'thoughts', 'collections']) {
          await garden.clearAll(client, userId, resource);
        }
      }
      // Collections first, so thought memberships can refer to them.
      const collectionsAdded = await garden.insertCollections(client, userId, collections);
      const thoughtsAdded = await garden.insertThoughts(client, userId, thoughts);
      const connectionsAdded = await garden.insertConnections(client, userId, connections);
      return { thoughtsAdded, collectionsAdded, connectionsAdded };
    });
    res.json(stats);
  }));

  return router;
}

module.exports = { gardenRoutes };
