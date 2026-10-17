const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

// scrypt cost parameters, stored with each hash so they can be raised later.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return crypto.timingSafeEqual(actual, expected);
}

// A fixed hash to verify against when the email is unknown, so a login attempt
// takes about as long whether or not the account exists.
let dummyHashPromise = null;
function dummyHash() {
  if (!dummyHashPromise) dummyHashPromise = hashPassword(crypto.randomBytes(16).toString('hex'));
  return dummyHashPromise;
}

const sha256Hex = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      // Ignore malformed cookie values.
    }
  }
  return out;
}

function createSessionStore(pool, sessionConfig) {
  const { cookieName, maxAgeMs, renewAfterMs, secureCookie } = sessionConfig;

  function setCookie(res, token, maxAge) {
    const attrs = [
      `${cookieName}=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${Math.floor(maxAge / 1000)}`,
    ];
    if (secureCookie) attrs.push('Secure');
    res.append('Set-Cookie', attrs.join('; '));
  }

  /** Creates a session for `userId` and sets its cookie on `res`. */
  async function start(res, userId, client = pool) {
    const token = crypto.randomBytes(32).toString('base64url');
    await client.query(
      'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [sha256Hex(token), userId, new Date(Date.now() + maxAgeMs)]
    );
    setCookie(res, token, maxAgeMs);
  }

  async function end(req, res) {
    const token = parseCookies(req.headers.cookie)[cookieName];
    if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [sha256Hex(token)]);
    setCookie(res, '', 0);
  }

  /**
   * Express middleware: loads the signed-in user into req.user (or leaves it
   * null). Long-lived sessions are extended; last_active_at is refreshed.
   */
  async function load(req, res, next) {
    req.user = null;
    const token = parseCookies(req.headers.cookie)[cookieName];
    if (!token) return next();
    try {
      const tokenHash = sha256Hex(token);
      const { rows } = await pool.query(
        `SELECT s.expires_at, u.id, u.email, u.name, u.reasons, u.created_at, u.last_active_at
           FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = $1 AND s.expires_at > now()`,
        [tokenHash]
      );
      if (rows.length === 0) {
        setCookie(res, '', 0);
        return next();
      }
      const row = rows[0];
      req.user = row;
      req.sessionTokenHash = tokenHash;

      const now = Date.now();
      if (new Date(row.expires_at).getTime() - now < maxAgeMs - renewAfterMs) {
        await pool.query('UPDATE sessions SET expires_at = $2 WHERE token_hash = $1', [
          tokenHash,
          new Date(now + maxAgeMs),
        ]);
        setCookie(res, token, maxAgeMs);
      }
      if (now - new Date(row.last_active_at).getTime() > 10 * 60 * 1000) {
        await pool.query('UPDATE users SET last_active_at = now() WHERE id = $1', [row.id]);
      }
      next();
    } catch (err) {
      next(err);
    }
  }

  return { start, end, load };
}

function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please log in again.' });
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  dummyHash,
  sha256Hex,
  parseCookies,
  createSessionStore,
  requireUser,
};
