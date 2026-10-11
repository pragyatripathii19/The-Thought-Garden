const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'garden-admin-2026';

// Smart organising: any OpenAI-compatible chat completions API (Groq by default).
const LLM_BASE_URL = (process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'llama-3.1-8b-instant';
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 15000;
const CLASSIFY_RATE_LIMIT = Number(process.env.CLASSIFY_RATE_LIMIT) || 10; // requests per user per window
const CLASSIFY_RATE_WINDOW_MS = 60 * 1000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = process.env.PILOT_DB_PATH || path.join(__dirname, 'pilot_garden.sqlite');
const db = new DatabaseSync(dbPath);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    reasons TEXT,
    created_at TEXT NOT NULL,
    last_active_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_activity (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    thoughts_count INTEGER DEFAULT 0,
    total_thoughts INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    category TEXT NOT NULL,
    rating INTEGER NOT NULL,
    message TEXT NOT NULL,
    email TEXT,
    created_at TEXT NOT NULL
  );
`);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'thought-garden-pilot-backend',
    timestamp: new Date().toISOString(),
    smartOrganizing: Boolean(LLM_API_KEY),
  });
});

// Smart organising: classify a new thought against its retrieved candidates.
// Stateless — thought text is forwarded to the LLM and never stored or logged here.
const classifyHits = new Map(); // userId -> request timestamps

function isRateLimited(userId) {
  const now = Date.now();
  const recent = (classifyHits.get(userId) || []).filter((t) => now - t < CLASSIFY_RATE_WINDOW_MS);
  if (recent.length >= CLASSIFY_RATE_LIMIT) {
    classifyHits.set(userId, recent);
    return true;
  }
  recent.push(now);
  classifyHits.set(userId, recent);
  return false;
}

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

app.post('/api/classify', async (req, res) => {
  try {
    if (!LLM_API_KEY) {
      return res.status(503).json({ error: 'Smart organising is not configured on this server' });
    }

    const { userId, thought, similarThoughts, collections } = req.body || {};
    if (!userId || !thought || typeof thought.id !== 'string' || typeof thought.text !== 'string') {
      return res.status(400).json({ error: 'userId and thought are required' });
    }
    if (!db.prepare('SELECT id FROM users WHERE id = ?').get(userId)) {
      return res.status(403).json({ error: 'Unknown pilot user' });
    }
    if (isRateLimited(userId)) {
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

    const llmRes = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CLASSIFY_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(input) },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
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

// 1. Pilot Signup / Profile Sync
app.post('/api/pilot/signup', (req, res) => {
  try {
    const { id, name, email, reasons } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    const now = new Date().toISOString();
    const reasonsStr = Array.isArray(reasons) ? JSON.stringify(reasons) : (reasons || '[]');

    const existingUser = db.prepare('SELECT id, created_at FROM users WHERE id = ?').get(id);

    if (existingUser) {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, reasons = ?, last_active_at = ?
        WHERE id = ?
      `).run(name, email || null, reasonsStr, now, id);
    } else {
      db.prepare(`
        INSERT INTO users (id, name, email, reasons, created_at, last_active_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, name, email || null, reasonsStr, now, now);
    }

    res.json({ ok: true, id, name });
  } catch (err) {
    console.error('Error in /api/pilot/signup:', err);
    res.status(500).json({ error: 'Failed to save pilot user' });
  }
});

// 2. Activity Ping (Daily Thoughts Count & Streak)
app.post('/api/pilot/ping', (req, res) => {
  try {
    const { userId, date, thoughtsCount, totalThoughts, streak } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ error: 'userId and date are required' });
    }

    const now = new Date().toISOString();
    const activityId = `${userId}_${date}`;

    // Update user's last active timestamp
    db.prepare(`UPDATE users SET last_active_at = ? WHERE id = ?`).run(now, userId);

    const existingActivity = db.prepare('SELECT id FROM daily_activity WHERE id = ?').get(activityId);

    if (existingActivity) {
      db.prepare(`
        UPDATE daily_activity
        SET thoughts_count = ?, total_thoughts = ?, streak = ?, updated_at = ?
        WHERE id = ?
      `).run(thoughtsCount || 0, totalThoughts || 0, streak || 0, now, activityId);
    } else {
      db.prepare(`
        INSERT INTO daily_activity (id, user_id, date, thoughts_count, total_thoughts, streak, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(activityId, userId, date, thoughtsCount || 0, totalThoughts || 0, streak || 0, now);
    }

    res.json({ ok: true, activityId });
  } catch (err) {
    console.error('Error in /api/pilot/ping:', err);
    res.status(500).json({ error: 'Failed to record activity ping' });
  }
});

// 3. User Feedback Submission
app.post('/api/pilot/feedback', (req, res) => {
  try {
    const { id, userId, userName, category, rating, message, email } = req.body;
    if (!category || !message) {
      return res.status(400).json({ error: 'category and message are required' });
    }

    const feedbackId = id || `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO feedback (id, user_id, user_name, category, rating, message, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      feedbackId,
      userId || null,
      userName || 'Anonymous Gardener',
      category,
      Number(rating) || 5,
      message,
      email || null,
      now
    );

    res.json({ ok: true, id: feedbackId });
  } catch (err) {
    console.error('Error in /api/pilot/feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// 4. Central Admin Dashboard Overview
app.get('/api/pilot/admin/overview', (req, res) => {
  try {
    const providedPasscode = req.headers['x-admin-passcode'];
    if (!providedPasscode || providedPasscode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized: Invalid admin passcode' });
    }

    // Get all registered users with enriched activity stats
    const todayStr = new Date().toISOString().slice(0, 10);
    const rawUsers = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    const users = rawUsers.map((u) => {
      let reasons = [];
      try {
        reasons = u.reasons ? JSON.parse(u.reasons) : [];
      } catch {
        reasons = [];
      }

      const userStats = db.prepare(`
        SELECT MAX(total_thoughts) as max_total, SUM(thoughts_count) as sum_count
        FROM daily_activity
        WHERE user_id = ?
      `).get(u.id);

      const latestActivity = db.prepare(`
        SELECT streak FROM daily_activity
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 1
      `).get(u.id);

      const todayActivity = db.prepare(`
        SELECT thoughts_count FROM daily_activity
        WHERE user_id = ? AND date = ?
      `).get(u.id, todayStr);

      const feedbackCount = db.prepare(`
        SELECT COUNT(*) as count FROM feedback
        WHERE user_id = ?
      `).get(u.id)?.count || 0;

      const userHistory = db.prepare(`
        SELECT date, thoughts_count, total_thoughts, streak
        FROM daily_activity
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 30
      `).all(u.id);

      return {
        ...u,
        createdAt: u.created_at || u.createdAt,
        lastActiveAt: u.last_active_at || u.lastActiveAt,
        reasons,
        totalThoughts: Math.max(userStats?.max_total || 0, userStats?.sum_count || 0),
        thoughtsToday: todayActivity?.thoughts_count || 0,
        streak: latestActivity?.streak || 0,
        feedbackCount,
        activityHistory: userHistory,
      };
    });

    // Get all feedback
    const feedback = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();

    // Get daily activity logs (last 30 days)
    const dailyActivities = db.prepare(`
      SELECT * FROM daily_activity
      ORDER BY date DESC
      LIMIT 100
    `).all();

    // Aggregate thoughts per day across all users
    const thoughtsPerDayAgg = db.prepare(`
      SELECT date, SUM(thoughts_count) as total_thoughts, COUNT(DISTINCT user_id) as active_users
      FROM daily_activity
      GROUP BY date
      ORDER BY date ASC
    `).all();

    // Summary KPIs
    const activeTodayCount = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM daily_activity
      WHERE date = ?
    `).get(todayStr)?.count || 0;

    const totalThoughtsSum = db.prepare(`
      SELECT SUM(thoughts_count) as total
      FROM daily_activity
    `).get()?.total || 0;

    const summary = {
      totalUsers: users.length,
      totalFeedback: feedback.length,
      totalThoughtsLogged: totalThoughtsSum,
      activeToday: activeTodayCount,
    };

    res.json({
      ok: true,
      summary,
      users,
      feedback,
      dailyActivities,
      thoughtsPerDayAgg,
    });
  } catch (err) {
    console.error('Error in /api/pilot/admin/overview:', err);
    res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
});

// 5. User Self-Service Account Deletion
app.delete('/api/pilot/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'User id is required' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    db.prepare('DELETE FROM daily_activity WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM feedback WHERE user_id = ?').run(id);

    res.json({ ok: true, deletedUserId: id });
  } catch (err) {
    console.error('Error in /api/pilot/users/:id delete:', err);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// 6. Admin Delete User (Passcode-Protected)
app.delete('/api/pilot/admin/users/:id', (req, res) => {
  try {
    const providedPasscode = req.headers['x-admin-passcode'];
    if (!providedPasscode || providedPasscode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized: Invalid admin passcode' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'User id is required' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    db.prepare('DELETE FROM daily_activity WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM feedback WHERE user_id = ?').run(id);

    res.json({ ok: true, deletedUserId: id });
  } catch (err) {
    console.error('Error in /api/pilot/admin/users/:id delete:', err);
    res.status(500).json({ error: 'Failed to delete user as admin' });
  }
});

// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Thought Garden] Pilot server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
