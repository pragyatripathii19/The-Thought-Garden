const express = require('express');
const { requireUser } = require('../auth.cjs');

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (date) => date.toISOString().slice(0, 10); // UTC day

/** Consecutive days with at least one thought, ending today (or yesterday if none yet today). */
function streakEndingAt(daySet, today) {
  let cursor = new Date(`${today}T00:00:00Z`);
  if (!daySet.has(today)) cursor = new Date(cursor.getTime() - DAY_MS);
  let streak = 0;
  while (daySet.has(dayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

function adminRoutes({ pool, config }) {
  const router = express.Router();
  router.use(requireUser, (req, res, next) => {
    if (!config.adminEmails.includes(String(req.user.email).toLowerCase())) {
      return res.status(403).json({ error: 'Only the garden admin can open this.' });
    }
    next();
  });

  // Counts only: the dashboard never reads thought text.
  router.get('/overview', async (req, res, next) => {
    try {
      const today = dayKey(new Date());
      const [usersResult, perDayResult, feedbackResult] = await Promise.all([
        pool.query(`
          SELECT u.id, u.name, u.email, u.reasons, u.created_at, u.last_active_at,
                 (SELECT count(*)::int FROM thoughts t WHERE t.user_id = u.id) AS total_thoughts,
                 (SELECT count(*)::int FROM feedback f WHERE f.user_id = u.id) AS feedback_count
            FROM users u
           ORDER BY u.created_at DESC`),
        pool.query(`
          SELECT user_id, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, count(*)::int AS n
            FROM thoughts
           GROUP BY 1, 2
           ORDER BY 2`),
        pool.query(`
          SELECT f.*, u.name AS user_name
            FROM feedback f LEFT JOIN users u ON u.id = f.user_id
           ORDER BY f.created_at DESC`),
      ]);

      const daysByUser = new Map();
      for (const row of perDayResult.rows) {
        if (!daysByUser.has(row.user_id)) daysByUser.set(row.user_id, []);
        daysByUser.get(row.user_id).push({ day: row.day, n: row.n });
      }

      const users = usersResult.rows.map((u) => {
        const days = daysByUser.get(u.id) || [];
        const daySet = new Set(days.map((d) => d.day));
        let running = 0;
        const history = days.map((d) => {
          running += d.n;
          return {
            date: d.day,
            thoughts_count: d.n,
            total_thoughts: running,
            streak: streakEndingAt(daySet, d.day),
          };
        });
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          reasons: u.reasons || [],
          createdAt: new Date(u.created_at).toISOString(),
          lastActiveAt: new Date(u.last_active_at).toISOString(),
          totalThoughts: u.total_thoughts,
          thoughtsToday: (days.find((d) => d.day === today) || { n: 0 }).n,
          streak: streakEndingAt(daySet, today),
          feedbackCount: u.feedback_count,
          activityHistory: history.slice(-30).reverse(),
        };
      });

      const perDay = new Map();
      for (const row of perDayResult.rows) {
        const entry = perDay.get(row.day) || { date: row.day, total_thoughts: 0, active_users: 0 };
        entry.total_thoughts += row.n;
        entry.active_users += 1;
        perDay.set(row.day, entry);
      }

      const feedback = feedbackResult.rows.map((f) => ({
        id: f.id,
        userId: f.user_id || undefined,
        userName: f.user_name || 'Deleted gardener',
        category: f.category,
        rating: f.rating,
        message: f.message,
        email: f.email || undefined,
        createdAt: new Date(f.created_at).toISOString(),
      }));

      res.json({
        summary: {
          totalUsers: users.length,
          totalFeedback: feedback.length,
          totalThoughtsLogged: users.reduce((sum, u) => sum + u.totalThoughts, 0),
          activeToday: users.filter((u) => u.lastActiveAt.slice(0, 10) === today).length,
        },
        users,
        feedback,
        dailyActivities: [],
        thoughtsPerDayAgg: [...perDay.values()],
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/users/:id', async (req, res, next) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Delete your own account from Data & Settings instead.' });
      }
      const { rowCount } = await pool.query('DELETE FROM users WHERE id::text = $1', [req.params.id]);
      if (rowCount === 0) return res.status(404).json({ error: 'No such user.' });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { adminRoutes };
