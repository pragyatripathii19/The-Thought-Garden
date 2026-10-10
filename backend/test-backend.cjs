const http = require('http');
const { app, db } = require('./server.cjs');

const server = app.listen(4005, async () => {
  try {
    console.log('Testing Pilot Backend API on port 4005...');

    // 1. Health check
    const health = await get('/api/health');
    console.log('✓ /api/health:', health.status);

    // 2. Signup
    const signup = await post('/api/pilot/signup', {
      id: 'usr_test_1',
      name: 'Pilot Tester',
      email: 'pilot@example.com',
      reasons: ['Daily Brain Dump', 'Startup Ideas'],
    });
    console.log('✓ /api/pilot/signup:', signup.ok, signup.name);

    // 3. Activity Ping
    const ping = await post('/api/pilot/ping', {
      userId: 'usr_test_1',
      date: '2026-10-10',
      thoughtsCount: 7,
      totalThoughts: 7,
      streak: 1,
    });
    console.log('✓ /api/pilot/ping:', ping.ok);

    // 4. Feedback
    const fb = await post('/api/pilot/feedback', {
      userId: 'usr_test_1',
      userName: 'Pilot Tester',
      category: 'suggestion',
      rating: 5,
      message: 'The falling leaves animation is wonderful!',
      email: 'pilot@example.com',
    });
    console.log('✓ /api/pilot/feedback:', fb.ok);

    // 5. Admin Overview with wrong passcode
    try {
      await get('/api/pilot/admin/overview', { 'x-admin-passcode': 'wrong-passcode' });
      console.error('FAIL: Admin overview did not reject invalid passcode');
      process.exit(1);
    } catch (err) {
      console.log('✓ Rejected unauthorized admin request');
    }

    // 6. Admin Overview with correct passcode
    const adminData = await get('/api/pilot/admin/overview', { 'x-admin-passcode': 'garden-admin-2026' });
    console.log('✓ /api/pilot/admin/overview:', {
      usersCount: adminData.users.length,
      feedbackCount: adminData.feedback.length,
      dailyActivitiesCount: adminData.dailyActivities.length,
      summary: adminData.summary,
      sampleUserStats: adminData.users[0]?.totalThoughts,
    });

    // 7. Test self-delete user
    const selfDel = await del('/api/pilot/users/usr_test_1');
    console.log('✓ DELETE /api/pilot/users/usr_test_1:', selfDel.ok);

    // 8. Create another test user for admin delete
    await post('/api/pilot/signup', {
      id: 'usr_test_admin_del',
      name: 'To Be Admin Deleted',
      email: 'delete_me@example.com',
      reasons: ['Testing Admin Delete'],
    });

    // 9. Admin delete with invalid passcode
    try {
      await del('/api/pilot/admin/users/usr_test_admin_del', { 'x-admin-passcode': 'wrong' });
      console.error('FAIL: Admin delete did not reject invalid passcode');
      process.exit(1);
    } catch {
      console.log('✓ Admin delete correctly rejected invalid passcode');
    }

    // 10. Admin delete with valid passcode
    const adminDel = await del('/api/pilot/admin/users/usr_test_admin_del', { 'x-admin-passcode': 'garden-admin-2026' });
    console.log('✓ DELETE /api/pilot/admin/users/usr_test_admin_del:', adminDel.ok);

    console.log('ALL BACKEND TESTS PASSED!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('Backend test failed:', err);
    server.close(() => process.exit(1));
  }
});

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4005,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
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
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4005,
        path,
        method: 'GET',
        headers,
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
    req.end();
  });
}

function del(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4005,
        path,
        method: 'DELETE',
        headers,
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
    req.end();
  });
}
