const { config } = require('./config.cjs');
const { createPool } = require('./db.cjs');
const { migrate } = require('./migrate.cjs');
const { createApp } = require('./app.cjs');

async function main() {
  const pool = createPool(config.databaseUrl);
  if (config.migrationDatabaseUrl) {
    const migrationPool = createPool(config.migrationDatabaseUrl);
    try {
      await migrate(migrationPool);
    } finally {
      await migrationPool.end();
    }
  } else {
    await migrate(pool);
  }
  if (config.adminEmails.length === 0) {
    console.log('[Thought Garden] No ADMIN_EMAILS set: only accounts with is_admin = true can open the admin dashboard.');
  }
  createApp({ pool, config }).listen(config.port, () => {
    console.log(`[Thought Garden] Server running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('[Thought Garden] Failed to start:', err.message);
  process.exit(1);
});
