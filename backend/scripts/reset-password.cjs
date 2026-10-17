// Sets a new random password for an account and signs it out everywhere.
// Usage: npm run reset-password -- someone@example.com
const crypto = require('crypto');
const { config } = require('../config.cjs');
const { createPool } = require('../db.cjs');
const { hashPassword } = require('../auth.cjs');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run reset-password -- someone@example.com');
    process.exit(1);
  }
  const pool = createPool(config.databaseUrl);
  try {
    const temporary = crypto.randomBytes(9).toString('base64url');
    const { rows } = await pool.query('UPDATE users SET password_hash = $2 WHERE email = $1 RETURNING id', [
      email,
      await hashPassword(temporary),
    ]);
    if (rows.length === 0) {
      console.error(`No account with the email ${email}.`);
      process.exitCode = 1;
      return;
    }
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [rows[0].id]);
    console.log(`New temporary password for ${email}: ${temporary}`);
    console.log('Send it to them privately. They are now logged out on every device.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
