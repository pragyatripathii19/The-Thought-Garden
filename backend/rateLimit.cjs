// In-memory limiters. They reset when the server restarts, which is fine for a
// single small instance.

/** Counts failures per key; a key is blocked once it reaches `max` within `windowMs`. */
function createFailureCounter({ max, windowMs }) {
  const records = new Map(); // key -> { count, firstAt }

  function current(key) {
    const record = records.get(key);
    if (record && Date.now() - record.firstAt > windowMs) {
      records.delete(key);
      return null;
    }
    return record || null;
  }

  return {
    isBlocked(key) {
      const record = current(key);
      return Boolean(record && record.count >= max);
    },
    fail(key) {
      const record = current(key) || { count: 0, firstAt: Date.now() };
      record.count++;
      records.set(key, record);
    },
    reset(key) {
      records.delete(key);
    },
  };
}

/** Allows at most `max` hits per key in any rolling `windowMs`. */
function createSlidingLimiter({ max, windowMs }) {
  const hits = new Map(); // key -> timestamps

  return {
    hit(key) {
      const now = Date.now();
      const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}

module.exports = { createFailureCounter, createSlidingLimiter };
