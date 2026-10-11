const http = require('http');
const os = require('os');
const path = require('path');

// Isolated test database, a known admin passcode, and a local stub standing in for the LLM provider.
const ADMIN = 'test-admin-passcode';
process.env.PILOT_DB_PATH = path.join(os.tmpdir(), `tg-test-${Date.now()}.sqlite`);
process.env.ADMIN_PASSCODE = ADMIN;
process.env.LLM_BASE_URL = 'http://localhost:4006/v1';
process.env.LLM_API_KEY = 'test-key';
process.env.CLASSIFY_RATE_LIMIT = '3';

// Per-user secrets (the browser generates these; 32+ characters).
const SECRET_1 = 'a'.repeat(64);
const SECRET_CLASSIFY = 'c'.repeat(64);
const SECRET_ADMIN_DEL = 'd'.repeat(64);
const WRONG_SECRET = 'x'.repeat(64);
const asUser = (secret) => ({ 'x-user-secret': secret });

let stubMode = 'assign';
let lastStubRequest = null;
const stub = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    lastStubRequest = { url: req.url, auth: req.headers.authorization, body: JSON.parse(raw) };
    const content =
      stubMode === 'garbage'
        ? 'not json at all'
        : JSON.stringify({ action: 'assign', collectionIds: ['col-writing'], reason: 'About writing.' });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
});
stub.listen(4006);

const { app } = require('./server.cjs');

const server = app.listen(4005, async () => {
  try {
    console.log('Testing Pilot Backend API on port 4005...');

    // 1. Health check
    const health = await get('/api/health');
    console.log('✓ /api/health:', health.status);

    // 2. Signup requires a secret
    await expectStatus(() => post('/api/pilot/signup', { id: 'usr_test_1', name: 'No Secret' }), 400);
    const signup = await post('/api/pilot/signup', {
      id: 'usr_test_1',
      name: 'Pilot Tester',
      email: 'pilot@example.com',
      reasons: ['Daily Brain Dump', 'Startup Ideas'],
      secret: SECRET_1,
    });
    console.log('✓ /api/pilot/signup:', signup.ok, signup.name);

    // 3. Someone else can't take over the profile with a different secret
    await expectStatus(
      () => post('/api/pilot/signup', { id: 'usr_test_1', name: 'Hijacker', secret: WRONG_SECRET }),
      403
    );
    console.log('✓ /api/pilot/signup rejects profile takeover');

    // 4. Activity ping requires the user's secret
    await expectStatus(
      () => post('/api/pilot/ping', { userId: 'usr_test_1', date: '2026-10-10', thoughtsCount: 1 }),
      403
    );
    const ping = await post(
      '/api/pilot/ping',
      { userId: 'usr_test_1', date: '2026-10-10', thoughtsCount: 7, totalThoughts: 7, streak: 1 },
      asUser(SECRET_1)
    );
    console.log('✓ /api/pilot/ping:', ping.ok);

    // 5. Feedback: attributed feedback needs the secret; anonymous feedback is allowed
    const feedbackBody = {
      userId: 'usr_test_1',
      userName: 'Pilot Tester',
      category: 'suggestion',
      rating: 5,
      message: 'The falling leaves animation is wonderful!',
      email: 'pilot@example.com',
    };
    await expectStatus(() => post('/api/pilot/feedback', feedbackBody, asUser(WRONG_SECRET)), 403);
    const fb = await post('/api/pilot/feedback', feedbackBody, asUser(SECRET_1));
    const anonFb = await post('/api/pilot/feedback', { category: 'other', rating: 4, message: 'Anonymous note' });
    console.log('✓ /api/pilot/feedback:', fb.ok, anonFb.ok);

    // 6. Admin overview: wrong passcode rejected
    await expectStatus(() => get('/api/pilot/admin/overview', { 'x-admin-passcode': 'wrong-passcode' }), 401);
    console.log('✓ Rejected unauthorized admin request');

    // 7. Admin overview with the configured passcode; secret hashes are never exposed
    const adminData = await get('/api/pilot/admin/overview', { 'x-admin-passcode': ADMIN });
    assert(adminData.users.length === 1, 'expected one user');
    assert(!('secret_hash' in adminData.users[0]), 'secret hashes must not be returned');
    console.log('✓ /api/pilot/admin/overview:', {
      usersCount: adminData.users.length,
      feedbackCount: adminData.feedback.length,
      summary: adminData.summary,
    });

    // 8. Self-delete requires the user's secret
    await expectStatus(() => del('/api/pilot/users/usr_test_1'), 403);
    await expectStatus(() => del('/api/pilot/users/usr_test_1', asUser(WRONG_SECRET)), 403);
    await expectStatus(() => del('/api/pilot/users/usr_unknown', asUser(SECRET_1)), 404);
    const selfDel = await del('/api/pilot/users/usr_test_1', asUser(SECRET_1));
    console.log('✓ DELETE /api/pilot/users/usr_test_1 (with secret):', selfDel.ok);

    // 9. Admin delete
    await post('/api/pilot/signup', {
      id: 'usr_test_admin_del',
      name: 'To Be Admin Deleted',
      reasons: ['Testing Admin Delete'],
      secret: SECRET_ADMIN_DEL,
    });
    await expectStatus(() => del('/api/pilot/admin/users/usr_test_admin_del', { 'x-admin-passcode': 'wrong' }), 401);
    const adminDel = await del('/api/pilot/admin/users/usr_test_admin_del', { 'x-admin-passcode': ADMIN });
    console.log('✓ DELETE /api/pilot/admin/users/usr_test_admin_del:', adminDel.ok);

    // 10. Smart organising: health advertises availability
    const health2 = await get('/api/health');
    assert(health2.smartOrganizing === true, 'health should report smartOrganizing');
    console.log('✓ /api/health reports smartOrganizing');

    const classifyBody = {
      userId: 'usr_classify',
      thought: { id: 't-new', text: 'Draft an essay about slow mornings' },
      similarThoughts: [{ id: 't-1', text: 'Blog idea on routines', collections: ['Writing'], ungrouped: false, similarity: 0.7 }],
      collections: [{ id: 'col-writing', name: 'Writing', description: 'Blog ideas', similarity: 0.6 }],
    };

    // 11. Unknown user, or a known user without their secret, is rejected
    await expectStatus(() => post('/api/classify', classifyBody, asUser(SECRET_CLASSIFY)), 403);
    await post('/api/pilot/signup', { id: 'usr_classify', name: 'Classifier', reasons: [], secret: SECRET_CLASSIFY });
    await expectStatus(() => post('/api/classify', classifyBody), 403);
    console.log('✓ /api/classify rejects unknown or unauthenticated users');

    // 12. Authenticated user gets a decision; key and model are forwarded
    const classified = await post('/api/classify', classifyBody, asUser(SECRET_CLASSIFY));
    assert(classified.decision.action === 'assign', 'expected assign decision');
    assert(lastStubRequest.auth === 'Bearer test-key', 'API key should be forwarded');
    assert(lastStubRequest.url === '/v1/chat/completions', 'should call chat completions');
    console.log('✓ /api/classify returns the provider decision');

    // 13. Malformed provider output is reported as 502, not passed through
    stubMode = 'garbage';
    await expectStatus(() => post('/api/classify', classifyBody, asUser(SECRET_CLASSIFY)), 502);
    stubMode = 'assign';
    console.log('✓ /api/classify handles malformed provider output');

    // 14. Rate limit (3 per minute in this test; 2 used above, rejected requests are not counted)
    await post('/api/classify', classifyBody, asUser(SECRET_CLASSIFY));
    await expectStatus(() => post('/api/classify', classifyBody, asUser(SECRET_CLASSIFY)), 429);
    console.log('✓ /api/classify rate-limits per user');

    // 15. Admin lockout after 10 consecutive wrong passcodes (successful logins above reset the count)
    for (let i = 0; i < 10; i++) {
      await expectStatus(() => get('/api/pilot/admin/overview', { 'x-admin-passcode': 'guess' }), 401);
    }
    await expectStatus(() => get('/api/pilot/admin/overview', { 'x-admin-passcode': ADMIN }), 429);
    console.log('✓ Admin passcode guessing is locked out');

    console.log('ALL BACKEND TESTS PASSED!');
    stub.close();
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('Backend test failed:', err);
    stub.close();
    server.close(() => process.exit(1));
  }
});

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function expectStatus(fn, status) {
  try {
    await fn();
  } catch (err) {
    if (String(err.message).startsWith(`HTTP ${status}`)) return;
    throw err;
  }
  throw new Error(`Expected HTTP ${status}`);
}

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4005,
        path,
        method,
        headers: data
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
          : headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
          resolve(JSON.parse(raw));
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const post = (path, body, headers) => request('POST', path, body, headers);
const get = (path, headers) => request('GET', path, undefined, headers);
const del = (path, headers) => request('DELETE', path, undefined, headers);
