const express = require('express');
const { requireUser, isAdminUser } = require('../auth.cjs');

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_DAYS = 30;

/** The time zone the admin asked for (IANA name), or UTC when missing or unknown. */
function validTimeZone(tz) {
  if (typeof tz !== 'string' || tz.length > 64) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/** YYYY-MM-DD for a moment, in a time zone. */
function dayIn(date, tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Calendar arithmetic on YYYY-MM-DD keys (time-zone independent). */
function addDays(day, n) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Consecutive days with at least one thought, ending on `today` (or the day before if none yet). */
function streakEndingAt(daySet, today) {
  let cursor = daySet.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (daySet.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

const count = (rows, key) => rows.reduce((sum, r) => sum + (r[key] || 0), 0);

function adminRoutes({ pool, config }) {
  const router = express.Router();
  router.use(requireUser, (req, res, next) => {
    if (!isAdminUser(req.user, config.adminEmails)) {
      return res.status(403).json({ error: 'Only the garden admin can open this.' });
    }
    next();
  });

  // Counts only: the dashboard never reads thought text.
  router.get('/overview', async (req, res, next) => {
    try {
      const tz = validTimeZone(req.query.tz);
      const today = dayIn(new Date(), tz);
      const weekStart = addDays(today, -6);
      const monthStart = addDays(today, -(CHART_DAYS - 1));

      const [usersResult, perDayResult, feedbackResult, stagesResult] = await Promise.all([
        pool.query(`
          SELECT u.id, u.name, u.email, u.reasons, u.created_at, u.last_active_at, u.is_admin, u.smart_organizing,
                 (SELECT count(*)::int FROM thoughts t WHERE t.user_id = u.id) AS total_thoughts,
                 (SELECT count(*)::int FROM feedback f WHERE f.user_id = u.id) AS feedback_count,
                 (SELECT count(*)::int FROM collections c WHERE c.user_id = u.id) AS collections,
                 (SELECT count(*)::int FROM collections c WHERE c.user_id = u.id AND c.origin = 'manual') AS collections_made,
                 (SELECT count(*)::int FROM collections c WHERE c.user_id = u.id AND c.origin = 'auto') AS collections_auto,
                 (SELECT count(*)::int FROM connections k WHERE k.user_id = u.id AND k.status = 'accepted') AS connections,
                 (SELECT count(*)::int FROM thoughts t WHERE t.user_id = u.id AND t.is_saved) AS saved_thoughts,
                 (SELECT count(*)::int FROM collections c WHERE c.user_id = u.id AND c.is_saved) AS saved_collections,
                 (SELECT count(*)::int FROM organize_events e WHERE e.user_id = u.id) AS auto_actions,
                 (SELECT count(*)::int FROM organize_events e WHERE e.user_id = u.id AND e.undone_at IS NOT NULL) AS auto_undone,
                 (SELECT count(*)::int FROM organize_events e WHERE e.user_id = u.id AND e.source = 'llm') AS auto_llm,
                 (SELECT count(*)::int FROM organize_events e WHERE e.user_id = u.id AND e.source = 'llm' AND e.undone_at IS NOT NULL) AS auto_llm_undone
            FROM users u
           ORDER BY u.created_at DESC`),
        pool.query(
          `SELECT user_id, to_char(created_at AT TIME ZONE $1, 'YYYY-MM-DD') AS day, count(*)::int AS n
             FROM thoughts
            GROUP BY 1, 2
            ORDER BY 2`,
          [tz]
        ),
        pool.query(`
          SELECT f.*, u.name AS user_name
            FROM feedback f LEFT JOIN users u ON u.id = f.user_id
           ORDER BY f.created_at DESC`),
        pool.query(`SELECT coalesce(stage, 'seed') AS stage, count(*)::int AS n FROM thoughts GROUP BY 1`),
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
          return { date: d.day, thoughts_count: d.n, total_thoughts: running, streak: streakEndingAt(daySet, d.day) };
        });
        const lastActiveAt = new Date(u.last_active_at);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          reasons: u.reasons || [],
          isAdmin: isAdminUser(u, config.adminEmails),
          smartOrganizing: u.smart_organizing !== false,
          createdAt: new Date(u.created_at).toISOString(),
          lastActiveAt: lastActiveAt.toISOString(),
          activeThisWeek: dayIn(lastActiveAt, tz) >= weekStart || days.some((d) => d.day >= weekStart),
          totalThoughts: u.total_thoughts,
          thoughtsToday: (days.find((d) => d.day === today) || { n: 0 }).n,
          thoughtsThisWeek: days.filter((d) => d.day >= weekStart).reduce((s, d) => s + d.n, 0),
          daysActive30: days.filter((d) => d.day >= monthStart).length,
          streak: streakEndingAt(daySet, today),
          feedbackCount: u.feedback_count,
          collections: u.collections,
          collectionsMade: u.collections_made,
          collectionsAuto: u.collections_auto,
          connections: u.connections,
          savedThoughts: u.saved_thoughts,
          savedCollections: u.saved_collections,
          autoActions: u.auto_actions,
          autoUndone: u.auto_undone,
          activityHistory: history.slice(-30).reverse(),
        };
      });

      // Last 30 days, empty days included, in the admin's time zone.
      const perDay = new Map();
      for (let i = CHART_DAYS - 1; i >= 0; i--) {
        const day = addDays(today, -i);
        perDay.set(day, { date: day, total_thoughts: 0, active_users: 0 });
      }
      for (const row of perDayResult.rows) {
        const entry = perDay.get(row.day);
        if (!entry) continue;
        entry.total_thoughts += row.n;
        entry.active_users += 1;
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

      const autoActions = count(usersResult.rows, 'auto_actions');
      const autoUndone = count(usersResult.rows, 'auto_undone');
      const llmActions = count(usersResult.rows, 'auto_llm');
      const llmUndone = count(usersResult.rows, 'auto_llm_undone');
      const stages = { seed: 0, sprout: 0, bloom: 0, mature: 0 };
      for (const r of stagesResult.rows) if (r.stage in stages) stages[r.stage] = r.n;

      res.json({
        timeZone: tz,
        summary: {
          totalUsers: users.length,
          admins: users.filter((u) => u.isAdmin).length,
          activeThisWeek: users.filter((u) => u.activeThisWeek).length,
          activeToday: users.filter((u) => dayIn(new Date(u.lastActiveAt), tz) === today || u.thoughtsToday > 0).length,
          thoughtsThisWeek: users.reduce((s, u) => s + u.thoughtsThisWeek, 0),
          totalThoughtsLogged: users.reduce((s, u) => s + u.totalThoughts, 0),
          totalFeedback: feedback.length,
          undoRate: autoActions > 0 ? autoUndone / autoActions : null,
        },
        organizing: {
          actions: autoActions,
          undone: autoUndone,
          llm: { actions: llmActions, undone: llmUndone },
          onDevice: { actions: autoActions - llmActions, undone: autoUndone - llmUndone },
          smartOrganizingOn: users.filter((u) => u.smartOrganizing).length,
        },
        features: {
          collectionsMade: count(usersResult.rows, 'collections_made'),
          collectionsAuto: count(usersResult.rows, 'collections_auto'),
          connections: count(usersResult.rows, 'connections'),
          savedThoughts: count(usersResult.rows, 'saved_thoughts'),
          savedCollections: count(usersResult.rows, 'saved_collections'),
          stages,
        },
        users,
        feedback,
        thoughtsPerDayAgg: [...perDay.values()],
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/users/:id', async (req, res, next) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Delete your own account from Settings instead.' });
      }
      const { rows } = await pool.query('SELECT email, is_admin FROM users WHERE id::text = $1', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'No such user.' });
      if (isAdminUser(rows[0], config.adminEmails)) {
        return res.status(403).json({ error: 'Admins can’t be deleted here. Remove their admin access first.' });
      }
      await pool.query('DELETE FROM users WHERE id::text = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { adminRoutes, validTimeZone, dayIn, addDays, streakEndingAt };
