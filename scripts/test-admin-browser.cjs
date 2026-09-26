// Requires playwright-core via NODE_PATH and a local Chrome installation.
// Starts an isolated development server; both server and browser use mock data.
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const apiPort = 3216;
const appPort = 3215;
const admin = { id: 'admin-test', name: 'Test Admin', email: 'admin@example.test', role: 'ADMIN', deletedAt: null };
const token = `${Buffer.from(JSON.stringify({ sub: admin.id })).toString('base64url')}.test-signature`;
const server = http.createServer((req, res) => {
  const allowed = req.url === '/admin/users/admin-test' && req.headers.authorization === `Bearer ${token}`;
  res.writeHead(allowed ? 200 : 403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(allowed ? admin : { message: 'Forbidden' }));
});
let app;
let log;
(async () => {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(apiPort, '127.0.0.1', resolve); });
  log = fs.openSync('/tmp/transpo24-admin-browser-server.log', 'w');
  app = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(appPort)], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}`, NEXT_PUBLIC_SOCKET_URL: `http://127.0.0.1:${apiPort}`, NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: '', NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', log, log],
  });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (app.exitCode !== null) throw new Error('Admin dev server exited; see /tmp/transpo24-admin-browser-server.log');
    try { const response = await fetch(`http://127.0.0.1:${appPort}/login`); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'Admin server did not become ready');
  const test = spawn(process.execPath, [path.join(__dirname, 'test-route-blocks-browser.cjs')], {
    env: { ...process.env, ADMIN_TEST_URL: `http://127.0.0.1:${appPort}` }, stdio: 'inherit',
  });
  const code = await new Promise((resolve, reject) => { test.once('error', reject); test.once('exit', resolve); });
  assert.equal(code, 0, 'Browser regression tests failed');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (app && app.exitCode === null) {
    const closed = new Promise(resolve => app.once('exit', resolve));
    app.kill('SIGTERM');
    await closed;
  }
  server.closeAllConnections();
  server.close();
  if (log !== undefined) fs.closeSync(log);
});
