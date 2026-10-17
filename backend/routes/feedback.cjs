const express = require('express');
const { requireUser } = require('../auth.cjs');

const CATEGORIES = ['suggestion', 'bug', 'praise', 'other'];

function feedbackRoutes({ pool }) {
  const router = express.Router();

  router.post('/', requireUser, async (req, res, next) => {
    try {
      const { category, rating, message, email } = req.body || {};
      if (!CATEGORIES.includes(category) || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Choose a category and write a message.' });
      }
      const stars = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
      const { rows } = await pool.query(
        `INSERT INTO feedback (user_id, category, rating, message, email)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          req.user.id,
          category,
          stars,
          message.trim().slice(0, 5000),
          typeof email === 'string' && email.trim() ? email.trim().slice(0, 254) : null,
        ]
      );
      res.status(201).json({ ok: true, id: rows[0].id });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { feedbackRoutes };
