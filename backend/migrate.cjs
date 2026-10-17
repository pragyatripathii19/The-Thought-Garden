const fs = require('fs');
const path = require('path');
const { withTransaction } = require('./db.cjs');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Applies every migrations/NNN_*.sql file not yet recorded in schema_migrations,
 * in order, each in its own transaction.
 */
async function migrate(pool, { log = console.log } = {}) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await withTransaction(pool, async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
    log(`[migrate] applied ${file}`);
  }
}

module.exports = { migrate };
