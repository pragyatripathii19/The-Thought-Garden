const express = require('express');
const { hashPassword, verifyPassword, dummyHash, requireUser } = require('../auth.cjs');
const { createFailureCounter, createSlidingLimiter } = require('../rateLimit.cjs');
const { withTransaction } = require('../db.cjs');
const { insertCollections } = require('../garden.cjs');
const { starterCollections } = require('../starterCollections.cjs');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function cleanName(value) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function cleanReasons(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r) => typeof r === 'string' && r.trim())
    .slice(0, 10)
    .map((r) => r.trim().slice(0, 100));
}

function authRoutes({ pool, sessions, config }) {
  const router = express.Router();
  const isAdmin = (email) => config.adminEmails.includes(String(email).toLowerCase());
  const publicUser = (u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    reasons: u.reasons || [],
    createdAt: new Date(u.created_at).toISOString(),
    isAdmin: isAdmin(u.email),
  });

  const emailFailures = createFailureCounter({
    max: config.login.maxFailuresPerEmail,
    windowMs: config.login.failureWindowMs,
  });
  const ipFailures = createFailureCounter({
    max: config.login.maxFailuresPerIp,
    windowMs: config.login.failureWindowMs,
  });
  const signupLimiter = createSlidingLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

  router.post('/signup', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body && req.body.email);
      const password = req.body && req.body.password;
      const name = cleanName(req.body && req.body.name);
      const reasons = cleanReasons(req.body && req.body.reasons);

      if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return res.status(400).json({ error: 'Enter a valid email address.' });
      }
      if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
        return res.status(400).json({ error: `Choose a password of at least ${MIN_PASSWORD} characters.` });
      }
      if (!name) return res.status(400).json({ error: 'Tell us what to call you.' });
      if (!signupLimiter.hit(req.ip || 'unknown')) {
        return res.status(429).json({ error: 'Too many new accounts from this network. Try again later.' });
      }

      const passwordHash = await hashPassword(password);
      const user = await withTransaction(pool, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO users (email, password_hash, name, reasons)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO NOTHING
           RETURNING *`,
          [email, passwordHash, name, JSON.stringify(reasons)]
        );
        if (rows.length === 0) return null;
        await insertCollections(client, rows[0].id, starterCollections());
        await sessions.start(res, rows[0].id, client);
        return rows[0];
      });
      if (!user) {
        return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
      }
      res.status(201).json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body && req.body.email);
      const password = req.body && req.body.password;
      const ip = req.ip || 'unknown';

      if (emailFailures.isBlocked(email) || ipFailures.isBlocked(ip)) {
        return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
      }
      if (!email || typeof password !== 'string' || password.length > MAX_PASSWORD) {
        return res.status(400).json({ error: 'Enter your email and password.' });
      }

      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0];
      const ok = await verifyPassword(password, user ? user.password_hash : await dummyHash());
      if (!user || !ok) {
        emailFailures.fail(email);
        ipFailures.fail(ip);
        return res.status(401).json({ error: 'That email and password don’t match.' });
      }

      emailFailures.reset(email);
      await sessions.start(res, user.id);
      await pool.query('UPDATE users SET last_active_at = now() WHERE id = $1', [user.id]);
      res.json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      await sessions.end(req, res);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', requireUser, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });

  router.patch('/me', requireUser, async (req, res, next) => {
    try {
      const updates = req.body || {};
      const name = updates.name === undefined ? req.user.name : cleanName(updates.name);
      if (!name) return res.status(400).json({ error: 'Tell us what to call you.' });
      const reasons = updates.reasons === undefined ? req.user.reasons : cleanReasons(updates.reasons);
      const { rows } = await pool.query(
        'UPDATE users SET name = $2, reasons = $3 WHERE id = $1 RETURNING *',
        [req.user.id, name, JSON.stringify(reasons)]
      );
      res.json({ user: publicUser(rows[0]) });
    } catch (err) {
      next(err);
    }
  });

  // Deletes the account and, by cascade, every thought, collection, session and feedback row.
  router.delete('/account', requireUser, async (req, res, next) => {
    try {
      const password = req.body && req.body.password;
      const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      if (typeof password !== 'string' || !rows[0] || !(await verifyPassword(password, rows[0].password_hash))) {
        return res.status(403).json({ error: 'That password isn’t right, so nothing was deleted.' });
      }
      await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
      await sessions.end(req, res);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { authRoutes };
