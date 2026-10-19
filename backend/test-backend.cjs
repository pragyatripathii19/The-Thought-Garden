// End-to-end API tests against a real Postgres test database.
// Run with: npm run test:backend   (needs TEST_DATABASE_URL in .env)
const http = require('http');
const assert = require('assert/strict');
const { config: baseConfig } = require('./config.cjs');
const { createPool } = require('./db.cjs');
const { migrate } = require('./migrate.cjs');
const { createApp } = require('./app.cjs');
const { validTimeZone, dayIn, addDays, streakEndingAt } = require('./routes/admin.cjs');
const { buildReminderIcs } = require('./routes/reminder.cjs');

const TEST_DB = process.env.TEST_DATABASE_URL || '';
if (!/test/i.test(new URL(TEST_DB || 'postgres://x/none').pathname)) {
  console.error('Set TEST_DATABASE_URL to a database whose name contains "test". Its tables are wiped on every run.');
  process.exit(1);
}

const ADMIN_EMAIL = 'admin@example.com';
const config = {
  ...baseConfig,
  isProduction: false,
  adminEmails: [ADMIN_EMAIL],
  llm: { ...baseConfig.llm, baseUrl: 'http://localhost:4016/v1', apiKey: 'test-key', rateLimit: 3 },
};

// Stand-in for the LLM provider.
let stubMode = 'assign';
let lastStubRequest = null;
let stubHits = 0;
const stub = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    stubHits++;
    lastStubRequest = { auth: req.headers.authorization, body: JSON.parse(raw) };
    if (stubMode === 'ratelimit') {
      res.writeHead(429, { 'Retry-After': '5', 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: { message: 'Rate limit reached' } }));
    }
    if (stubMode === 'error') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end('{}');
    }
    const content =
      stubMode === 'garbage'
        ? 'not json at all'
        : JSON.stringify({ action: 'assign', collectionIds: ['col-writing'], reason: 'About writing.' });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
});

let base = '';

/** A tiny cookie-keeping client, one per simulated browser. */
function client() {
  let cookie = '';
  async function request(method, path, body, { json = true } = {}) {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    if (json) headers['Content-Type'] = 'application/json';
    const res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? (json && method !== 'GET' ? '{}' : undefined) : JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const pair = setCookie.split(';')[0];
      cookie = pair.endsWith('=') ? '' : pair;
    }
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }
  return {
    get: (p) => request('GET', p),
    put: (p, b) => request('PUT', p, b),
    post: (p, b, o) => request('POST', p, b, o),
    patch: (p, b) => request('PATCH', p, b),
    del: (p, b) => request('DELETE', p, b),
    hasCookie: () => Boolean(cookie),
  };
}

const now = () => new Date().toISOString();
const thought = (id, text, extra = {}) => ({
  id,
  text,
  createdAt: now(),
  updatedAt: now(),
  collectionIds: [],
  stage: 'seed',
  isSaved: false,
  ...extra,
});
const connection = (id, source, target, extra = {}) => ({
  id,
  sourceThoughtId: source,
  targetThoughtId: target,
  status: 'accepted',
  reason: 'Both mention gardens.',
  createdAt: now(),
  updatedAt: now(),
  ...extra,
});

function expectStatus(res, status, label) {
  assert.equal(res.status, status, `${label}: expected HTTP ${status}, got ${res.status} ${JSON.stringify(res.data)}`);
  console.log(`✓ ${label}`);
}

async function signup(c, email, name = 'Tester') {
  return c.post('/api/auth/signup', { email, password: 'correct horse battery', name, reasons: [] });
}

async function run(pool) {
  // ---------- dashboard date helpers ----------
  assert.equal(validTimeZone('Asia/Kolkata'), 'Asia/Kolkata');
  assert.equal(validTimeZone('Not/A_Zone'), 'UTC');
  assert.equal(dayIn(new Date('2026-01-10T20:00:00Z'), 'Asia/Kolkata'), '2026-01-11', '1:30 am in India is the next day');
  assert.equal(dayIn(new Date('2026-01-10T20:00:00Z'), 'UTC'), '2026-01-10');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(streakEndingAt(new Set(['2026-01-09', '2026-01-10']), '2026-01-11'), 2, 'a streak survives until the day ends');
  console.log('✓ dashboard date helpers');

  // ---------- daily reminder (calendar file) ----------
  const ics = buildReminderIcs({
    time: '07:30',
    date: '2026-10-19',
    appUrl: 'https://the-thought-garden.onrender.com/?new=1',
    now: new Date('2026-10-19T01:02:03.456Z'),
    uid: 'u1',
  });
  assert.ok(ics.split('\r\n').every((line) => line.length <= 75), 'calendar lines stay within 75 characters');
  const unfolded = ics.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('DTSTART:20261019T073000\r\n'), 'the reminder starts at the chosen local time');
  assert.ok(unfolded.includes('RRULE:FREQ=DAILY'), 'it repeats every day');
  assert.ok(unfolded.includes('DTSTAMP:20261019T010203Z'));
  assert.ok(unfolded.includes('URL:https://the-thought-garden.onrender.com/?new=1'), 'tapping it opens a new thought');
  const reminder = await fetch(base + '/api/reminder.ics?time=21:15&date=2026-10-19');
  assert.equal(reminder.status, 200);
  assert.match(reminder.headers.get('content-type'), /^text\/calendar/);
  assert.ok((await reminder.text()).includes('DTSTART:20261019T211500'), 'served without an account');
  expectStatus(await client().get('/api/reminder.ics?time=25:00'), 400, 'a reminder needs a real time');
  console.log('✓ daily reminder calendar file');

  // ---------- accounts ----------
  const health = await client().get('/api/health');
  expectStatus(health, 200, 'health check reaches the database');

  const alice = client();
  expectStatus(await signup(alice, 'Alice@Example.com', 'Alice'), 201, 'signup creates an account');
  assert.ok(alice.hasCookie(), 'signup sets a session cookie');
  const me = await alice.get('/api/auth/me');
  expectStatus(me, 200, 'me returns the signed-in user');
  assert.equal(me.data.user.email, 'alice@example.com', 'emails are stored lowercased');
  assert.equal(me.data.user.isAdmin, false);
  assert.equal(me.data.user.smartOrganizing, true, 'Smart organising is on by default');

  expectStatus(await signup(client(), 'alice@example.com'), 409, 'duplicate email is refused');
  expectStatus(
    await client().post('/api/auth/signup', { email: 'nope', password: 'longenough', name: 'X' }),
    400,
    'invalid email is refused'
  );
  expectStatus(
    await client().post('/api/auth/signup', { email: 'short@example.com', password: 'short', name: 'X' }),
    400,
    'short password is refused'
  );
  expectStatus(await client().get('/api/auth/me'), 401, 'me without a session is 401');
  expectStatus(await client().get('/api/thoughts'), 401, 'garden routes need a session');

  const patched = await alice.patch('/api/auth/me', { name: 'Alice G', reasons: ['Research'] });
  expectStatus(patched, 200, 'profile update');
  assert.equal(patched.data.user.name, 'Alice G');

  // ---------- starter collections & thoughts ----------
  const starter = await alice.get('/api/collections');
  assert.equal(starter.data.collections.length, 4, 'no reasons given: the original 4 starter collections');
  console.log('✓ starter collections seeded');

  // Starter collections follow why someone joined; a free-text reason gets its own collection.
  const writer = client();
  await writer.post('/api/auth/signup', {
    email: 'writer@example.com', password: 'correct horse battery', name: 'Writer',
    reasons: ['writing', 'mindfulness', 'learning spanish'], customReasonIcon: 'study',
  });
  const writerCols = (await writer.get('/api/collections')).data.collections;
  assert.deepEqual(writerCols.map((c) => c.name).sort(), ['Learning Spanish', 'Reflections', 'Writing']);
  assert.equal(writerCols.find((c) => c.name === 'Learning Spanish').iconType, 'study', 'the custom collection gets the suggested icon');
  assert.deepEqual((await writer.get('/api/auth/me')).data.user.reasons, ['writing', 'mindfulness', 'learning spanish']);
  await writer.del('/api/auth/account', { password: 'correct horse battery' });
  console.log('✓ starter collections follow sign-up reasons');

  const t1 = thought('t1', 'Write about community gardens', {
    collectionIds: ['col-writing', 'col-does-not-exist'],
    autoCollectionIds: ['col-writing'],
    classifyState: 'done',
  });
  const put1 = await alice.put('/api/thoughts/t1', t1);
  expectStatus(put1, 200, 'create thought');
  assert.deepEqual(put1.data.thought.collectionIds, ['col-writing'], 'unknown collection ids are dropped');
  assert.deepEqual(put1.data.thought.autoCollectionIds, ['col-writing']);
  assert.equal(put1.data.thought.createdAt, t1.createdAt, 'timestamps round-trip exactly');
  const grown = await alice.put('/api/thoughts/t1', { ...t1, editCount: 3, stageManual: true, stage: 'bloom' });
  assert.equal(grown.data.thought.editCount, 3, 'edit count is stored');
  assert.equal(grown.data.thought.stageManual, true, 'a hand-picked stage is remembered');
  await alice.put('/api/thoughts/t1', t1);
  assert.equal((await alice.get('/api/thoughts')).data.thoughts.find((t) => t.id === 't1').editCount, undefined, 'edit count resets with the thought');
  console.log('✓ growth fields round-trip');

  expectStatus(await alice.put('/api/thoughts/other', t1), 400, 'URL id must match body id');
  expectStatus(await alice.put('/api/thoughts/t1', { ...t1, text: '   ' }), 400, 'empty thought text is refused');
  expectStatus(await alice.post('/api/feedback', undefined, { json: false }), 415, 'non-JSON writes are refused');

  const edited = await alice.put('/api/thoughts/t1', { ...t1, text: 'Edited', collectionIds: [], autoCollectionIds: [] });
  assert.equal(edited.data.thought.text, 'Edited');
  assert.deepEqual(edited.data.thought.collectionIds, [], 'memberships are replaced on update');
  console.log('✓ update thought');

  await alice.put('/api/thoughts/t2', thought('t2', 'Seed library idea', { collectionIds: ['col-startup-ideas'] }));
  await alice.put('/api/thoughts/t3', thought('t3', 'Compost workshop'));

  // ---------- isolation between users ----------
  const bob = client();
  expectStatus(await signup(bob, 'bob@example.com', 'Bob'), 201, 'second account');
  assert.equal((await bob.get('/api/thoughts')).data.thoughts.length, 0, "Bob can't see Alice's thoughts");
  await bob.put('/api/thoughts/t1', thought('t1', "Bob's own t1"));
  await bob.del('/api/thoughts/t2');
  await bob.del('/api/collections/col-writing');
  const aliceThoughts = (await alice.get('/api/thoughts')).data.thoughts;
  assert.equal(aliceThoughts.length, 3, "Bob's deletes don't touch Alice's thoughts");
  assert.equal(aliceThoughts.find((t) => t.id === 't1').text, 'Edited', "Bob's write with the same id stays in his garden");
  assert.equal((await alice.get('/api/collections')).data.collections.length, 4, "Bob can't delete Alice's collections");
  console.log('✓ users are isolated from each other');

  // ---------- collections ----------
  const col = { id: 'col-x', name: 'Garden projects', createdAt: now(), updatedAt: now(), origin: 'auto', autoReason: 'Shared theme' };
  expectStatus(await alice.put('/api/collections/col-x', col), 200, 'create collection');
  const withIcon = await alice.put('/api/collections/col-icon', { ...col, id: 'col-icon', iconType: 'travel' });
  assert.equal(withIcon.data.collection.iconType, 'travel', 'any curated icon key is stored');
  expectStatus(await alice.put('/api/collections/col-icon', { ...col, id: 'col-icon', iconType: 'Not An Icon!' }), 400, 'malformed icon keys are refused');
  const savedCol = await alice.put('/api/collections/col-icon', { ...col, id: 'col-icon', isSaved: true });
  assert.equal(savedCol.data.collection.isSaved, true, 'collections can be saved');
  await alice.del('/api/collections/col-icon');
  await alice.put('/api/thoughts/t3', thought('t3', 'Compost workshop', { collectionIds: ['col-x'] }));
  await alice.del('/api/collections/col-x');
  const t3 = (await alice.get('/api/thoughts')).data.thoughts.find((t) => t.id === 't3');
  assert.deepEqual(t3.collectionIds, [], 'deleting a collection removes its memberships');
  console.log('✓ collection delete cascades to memberships');

  // ---------- connections ----------
  expectStatus(await alice.put('/api/connections/c1', connection('c1', 't1', 't2')), 200, 'create connection');
  expectStatus(await alice.put('/api/connections/c2', connection('c2', 't2', 't1')), 409, 'duplicate pair (reversed) is refused');
  expectStatus(await alice.put('/api/connections/c3', connection('c3', 't1', 't1')), 400, 'self-connection is refused');
  const c1 = await alice.put('/api/connections/c1', connection('c1', 't1', 't2', { status: 'dismissed' }));
  assert.equal(c1.data.connection.status, 'dismissed', 'connection update');
  await alice.del('/api/thoughts/t2');
  assert.equal((await alice.get('/api/connections')).data.connections.length, 0, 'deleting a thought removes its connections');
  console.log('✓ thought delete removes its connections');

  // ---------- organiser log ----------
  const event = {
    id: 'e1', thoughtId: 't1', action: 'assign', collectionId: 'col-writing', collectionName: 'Writing',
    reason: 'Similar thoughts', source: 'local', createdAt: now(),
  };
  expectStatus(await alice.put('/api/organize-events/e1', event), 200, 'record organise event');
  const undone = await alice.put('/api/organize-events/e1', { ...event, undoneAt: now() });
  assert.ok(undone.data.event.undoneAt, 'undo is recorded');

  // ---------- import ----------
  const backup = {
    thoughts: [thought('t1', 'Duplicate id, should be skipped'), thought('t9', 'Imported', { collectionIds: ['col-imp'] })],
    collections: [{ id: 'col-imp', name: 'Imported', createdAt: now(), updatedAt: now() }],
    connections: [connection('c9', 't1', 't9')],
  };
  const merged = await alice.post('/api/garden/import', { garden: backup, strategy: 'merge' });
  expectStatus(merged, 200, 'merge import');
  assert.deepEqual(merged.data, { thoughtsAdded: 1, collectionsAdded: 1, connectionsAdded: 1 });
  const afterMerge = (await alice.get('/api/thoughts')).data.thoughts;
  assert.equal(afterMerge.find((t) => t.id === 't1').text, 'Edited', 'merge keeps existing thoughts');
  assert.deepEqual(afterMerge.find((t) => t.id === 't9').collectionIds, ['col-imp'], 'imported memberships survive');

  const replaced = await alice.post('/api/garden/import', { garden: backup, strategy: 'replace' });
  assert.deepEqual(replaced.data, { thoughtsAdded: 2, collectionsAdded: 1, connectionsAdded: 1 });
  assert.equal((await alice.get('/api/thoughts')).data.thoughts.length, 2, 'replace import wipes the old garden first');
  assert.equal((await alice.get('/api/organize-events')).data.events.length, 0, 'replace clears the organiser log');
  console.log('✓ replace import');
  expectStatus(
    await alice.post('/api/garden/import', { garden: { thoughts: [{ id: 'bad' }] }, strategy: 'merge' }),
    400,
    'malformed import is refused'
  );
  assert.equal((await alice.get('/api/thoughts')).data.thoughts.length, 2, 'a refused import changes nothing');

  // ---------- feedback, admin ----------
  expectStatus(await alice.post('/api/feedback', { category: 'praise', rating: 5, message: 'Lovely' }), 201, 'feedback');
  // Organiser history for the dashboard's undo rate: two automatic actions, one undone.
  for (const [id, undone, source] of [['ea', true, 'llm'], ['eb', false, 'local']]) {
    await alice.put(`/api/organize-events/${id}`, {
      id, thoughtId: 't9', action: 'assign', collectionId: 'col-imp', collectionName: 'Imported',
      reason: 'Similar', source, createdAt: now(), ...(undone ? { undoneAt: now() } : {}),
    });
  }
  expectStatus(await alice.get('/api/admin/overview'), 403, 'non-admins cannot open the dashboard');
  // An admin flagged in the database (not listed in ADMIN_EMAILS).
  await pool.query("UPDATE users SET is_admin = '1' WHERE email = 'bob@example.com'");
  assert.equal((await bob.get('/api/auth/me')).data.user.isAdmin, true, 'is_admin in the database makes an admin');
  expectStatus(await bob.get('/api/admin/overview'), 200, 'a database-flagged admin can open the dashboard');
  await pool.query("UPDATE users SET is_admin = false WHERE email = 'bob@example.com'");
  expectStatus(await bob.get('/api/admin/overview'), 403, 'removing the flag removes access');
  const admin = client();
  await signup(admin, ADMIN_EMAIL, 'Admin');
  const overview = await admin.get('/api/admin/overview?tz=Asia/Kolkata');
  expectStatus(overview, 200, 'admin overview');
  assert.equal(overview.data.timeZone, 'Asia/Kolkata', 'days are counted in the admin’s time zone');
  assert.equal(overview.data.thoughtsPerDayAgg.length, 30, 'the chart always covers 30 days');
  assert.equal(overview.data.thoughtsPerDayAgg[29].date, dayIn(new Date(), 'Asia/Kolkata'), 'the chart ends today');
  assert.deepEqual(
    { actions: overview.data.organizing.actions, undone: overview.data.organizing.undone, rate: overview.data.summary.undoRate },
    { actions: 2, undone: 1, rate: 0.5 },
    'organising health counts automatic actions and undos'
  );
  assert.deepEqual(overview.data.organizing.llm, { actions: 1, undone: 1 }, 'AI and on-device actions are split');
  assert.equal(overview.data.summary.thoughtsThisWeek, 3, 'Alice planted 2 this week, Bob 1');
  assert.equal(overview.data.summary.activeThisWeek >= 1, true);
  assert.equal(overview.data.users.find((u) => u.email === ADMIN_EMAIL).isAdmin, true, 'admins are marked');
  expectStatus(await admin.get('/api/admin/overview?tz=Not/A_Zone'), 200, 'an unknown time zone falls back to UTC');
  console.log('✓ dashboard: time zone, 30-day chart, organising health');
  await pool.query("UPDATE users SET is_admin = true WHERE email = 'bob@example.com'");
  const bobId = (await bob.get('/api/auth/me')).data.user.id;
  expectStatus(await admin.del(`/api/admin/users/${bobId}`), 403, 'admins cannot delete other admins');
  await pool.query("UPDATE users SET is_admin = false WHERE email = 'bob@example.com'");
  assert.equal(overview.data.summary.totalUsers, 3);
  const aliceRow = overview.data.users.find((u) => u.email === 'alice@example.com');
  assert.equal(aliceRow.totalThoughts, 2);
  assert.equal(aliceRow.thoughtsToday, 2);
  assert.equal(aliceRow.feedbackCount, 1);
  assert.ok(!JSON.stringify(overview.data).includes('Imported'), 'the dashboard never includes thought text');
  console.log('✓ admin overview has counts, not content');

  // ---------- Smart organising ----------
  const classifyBody = { thought: { id: 't1', text: 'A thought' }, similarThoughts: [], collections: [], userFocus: ['Writing & journaling'] };
  expectStatus(await client().post('/api/classify', classifyBody), 401, 'classify needs a session');
  const classified = await alice.post('/api/classify', classifyBody);
  expectStatus(classified, 200, 'classify proxies to the provider');
  assert.equal(lastStubRequest.auth, 'Bearer test-key');
  assert.deepEqual(JSON.parse(lastStubRequest.body.messages[1].content).userFocus, ['Writing & journaling'], 'the person’s focus reaches the AI');
  assert.equal(lastStubRequest.body.model, 'openai/gpt-oss-20b', 'default model');
  assert.equal(lastStubRequest.body.reasoning_effort, 'low', 'gpt-oss models get low reasoning effort');
  stubMode = 'garbage';
  expectStatus(await alice.post('/api/classify', classifyBody), 502, 'malformed provider output is handled');
  await alice.post('/api/classify', classifyBody);
  const userLimited = await alice.post('/api/classify', classifyBody);
  expectStatus(userLimited, 429, 'classify is rate-limited per user');
  assert.ok(userLimited.data.retryAfterSeconds > 0, 'a rate limit says when to retry');

  stubMode = 'error';
  expectStatus(await bob.post('/api/classify', classifyBody), 502, 'provider errors become 502');

  expectStatus(await bob.patch('/api/auth/me', { smartOrganizing: false }), 200, 'turn Smart organising off');
  assert.equal((await bob.get('/api/auth/me')).data.user.smartOrganizing, false, 'the choice is saved to the account');
  const hitsBefore = stubHits;
  expectStatus(await bob.post('/api/classify', classifyBody), 403, 'classify is refused when the account turned it off');
  assert.equal(stubHits, hitsBefore, 'nothing is sent to the provider for that account');
  expectStatus(await bob.patch('/api/auth/me', { smartOrganizing: 'yes' }), 400, 'smartOrganizing must be a boolean');
  await bob.patch('/api/auth/me', { smartOrganizing: true });

  const optedOut = client();
  const optedOutSignup = await optedOut.post('/api/auth/signup', {
    email: 'quiet@example.com', password: 'correct horse battery', name: 'Quiet', smartOrganizing: false,
  });
  assert.equal(optedOutSignup.data.user.smartOrganizing, false, 'unticking it at sign-up is respected');
  console.log('✓ Smart organising preference lives on the account');

  stubMode = 'ratelimit';
  const providerLimited = await bob.post('/api/classify', classifyBody);
  expectStatus(providerLimited, 429, "the provider's rate limit is passed on");
  assert.equal(providerLimited.data.retryAfterSeconds, 5, "the provider's Retry-After is passed on");
  const hitsAfterLimit = stubHits;
  const paused = await admin.post('/api/classify', classifyBody);
  expectStatus(paused, 429, 'other users are paused too while the provider is limited');
  assert.equal(stubHits, hitsAfterLimit, 'no request reaches the provider during the pause');
  stubMode = 'assign';

  // ---------- logout, login, lockout ----------
  expectStatus(await alice.post('/api/auth/logout'), 200, 'logout');
  expectStatus(await alice.get('/api/auth/me'), 401, 'session ends on logout');
  expectStatus(
    await alice.post('/api/auth/login', { email: 'alice@example.com', password: 'wrong password' }),
    401,
    'wrong password is refused'
  );
  expectStatus(
    await alice.post('/api/auth/login', { email: 'ALICE@example.com', password: 'correct horse battery' }),
    200,
    'login (email is case-insensitive)'
  );
  assert.equal((await alice.get('/api/thoughts')).data.thoughts.length, 2, 'the garden is there after logging back in');

  // ---------- account deletion ----------
  const aliceId = (await alice.get('/api/auth/me')).data.user.id;
  expectStatus(await alice.del('/api/auth/account', { password: 'wrong' }), 403, 'deletion needs the password');
  expectStatus(await alice.del('/api/auth/account', { password: 'correct horse battery' }), 200, 'delete account');
  for (const table of ['users', 'sessions', 'thoughts', 'collections', 'connections', 'thought_collections', 'organize_events', 'feedback']) {
    const column = table === 'users' ? 'id' : 'user_id';
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1`, [aliceId]);
    assert.equal(rows[0].n, 0, `${table} has no rows left for the deleted account`);
  }
  console.log('✓ deleting an account removes every row it owned');
  assert.equal((await bob.get('/api/thoughts')).data.thoughts.length, 1, "other users' gardens are untouched");

  // Lockout last: it blocks Bob's email for 15 minutes.
  const attacker = client();
  for (let i = 0; i < 10; i++) {
    await attacker.post('/api/auth/login', { email: 'bob@example.com', password: `guess-${i}` });
  }
  expectStatus(
    await attacker.post('/api/auth/login', { email: 'bob@example.com', password: 'correct horse battery' }),
    429,
    'repeated failures lock the account temporarily'
  );
}

async function main() {
  const pool = createPool(TEST_DB);
  let server;
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await migrate(pool, { log: () => {} });
    await new Promise((resolve) => stub.listen(4016, resolve));
    server = createApp({ pool, config }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://localhost:${server.address().port}`;
    console.log(`Testing the API at ${base}\n`);
    await run(pool);
    console.log('\nAll backend tests passed.');
  } catch (err) {
    console.error('\n✗ FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    stub.close();
    await pool.end();
  }
}

main();
