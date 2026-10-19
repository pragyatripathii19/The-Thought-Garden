const express = require('express');
const path = require('path');
const fs = require('fs');
const { createSessionStore } = require('./auth.cjs');
const { ValidationError } = require('./garden.cjs');
const { authRoutes } = require('./routes/auth.cjs');
const { gardenRoutes } = require('./routes/garden.cjs');
const { feedbackRoutes } = require('./routes/feedback.cjs');
const { adminRoutes } = require('./routes/admin.cjs');
const { classifyRoutes } = require('./routes/classify.cjs');
const { reminderRoutes } = require('./routes/reminder.cjs');

/** Builds the Express app. Kept separate from listen() so tests can run it on any port. */
function createApp({ pool, config }) {
  const app = express();
  // Behind Render's proxy, req.ip must come from X-Forwarded-For for rate limits to work.
  if (config.isProduction) app.set('trust proxy', 1);

  const sessions = createSessionStore(pool, config.session);

  // Large bodies only for backup imports.
  const smallJson = express.json({ limit: '1mb' });
  const largeJson = express.json({ limit: '25mb' });
  app.use('/api', (req, res, next) => (req.path === '/garden/import' ? largeJson : smallJson)(req, res, next));

  // CSRF guard: browsers can't send a cross-site JSON request with cookies
  // without a CORS preflight, which this server never approves.
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.is('application/json')) return next();
    res.status(415).json({ error: 'Requests must be sent as JSON.' });
  });

  app.use('/api', sessions.load);

  app.get('/api/health', async (req, res) => {
    let database = false;
    try {
      await pool.query('SELECT 1');
      database = true;
    } catch {
      // Reported below.
    }
    res.status(database ? 200 : 503).json({
      status: database ? 'ok' : 'database-unavailable',
      database,
      smartOrganizing: Boolean(config.llm.apiKey),
    });
  });

  app.use('/api/auth', authRoutes({ pool, sessions, config }));
  app.use('/api/feedback', feedbackRoutes({ pool }));
  app.use('/api/admin', adminRoutes({ pool, config }));
  app.use('/api/classify', classifyRoutes({ config }));
  app.use('/api', reminderRoutes());
  app.use('/api', gardenRoutes({ pool }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'That request is too large.' });
    console.error(`[${req.method} ${req.path}]`, err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  // Serve the built frontend (npm run build) from the same origin as the API.
  const distPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  return app;
}

module.exports = { createApp };
