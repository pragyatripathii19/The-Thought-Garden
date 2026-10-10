const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'garden-admin-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'pilot_garden.sqlite');
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
  });
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

    // Get all registered users
    const rawUsers = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    const users = rawUsers.map((u) => ({
      ...u,
      reasons: u.reasons ? JSON.parse(u.reasons) : [],
    }));

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
    const todayStr = new Date().toISOString().slice(0, 10);
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
