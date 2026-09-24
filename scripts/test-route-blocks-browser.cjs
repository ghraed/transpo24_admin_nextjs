// Run against a local admin build with playwright-core available via NODE_PATH.
// All API calls are intercepted; this never modifies a real backend.
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true });
  const base = process.env.ADMIN_TEST_URL || 'http://127.0.0.1:3215';
  assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Browser test must target localhost');
  const context = await browser.newContext();
  let rows = Array.from({ length: 21 }, (_, i) => ({ id: `block-${i}`, fromCountryCode: 'LB', toCountryCode: 'SY', transportType: null, reason: `Internal reason ${i}`, isActive: true, createdByAdminId: 'admin-test', createdAt: '2026-09-24T10:00:00Z', updatedAt: '2026-09-24T10:00:00Z' }));
  const requests = [];
  let duplicate = false;
  let failList = false;
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    // Intercept API paths even with a same-origin proxy; never write to a real backend.
    if (!url.pathname.startsWith('/admin/route-blocks')) {
      if (url.origin === base) return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS' };
    const reply = (data, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(data) });
    if (request.method() === 'OPTIONS') return reply({});
    requests.push({ method: request.method(), url, body: request.postDataJSON(), authorization: request.headers().authorization });
    const id = url.pathname.split('/')[3];
    if (request.method() === 'GET' && id) return rows.find(row => row.id === id) ? reply(rows.find(row => row.id === id)) : reply({ message: 'Route block not found.' }, 404);
    if (request.method() === 'GET') {
      if (failList) return reply({ message: 'Administrator access is required.' }, 403);
      const filtered = rows.filter(row => ['fromCountryCode', 'toCountryCode', 'transportType', 'isActive'].every(key => !url.searchParams.has(key) || String(row[key]) === url.searchParams.get(key)));
      const page = Number(url.searchParams.get('page'));
      const limit = Number(url.searchParams.get('limit'));
      return reply({ items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit });
    }
    if (duplicate) return reply({ code: 'ROUTE_BLOCK_DUPLICATE', message: 'An equivalent active route block already exists.' }, 409);
    const body = request.postDataJSON();
    if (request.method() === 'POST') {
      const row = { ...rows[0], ...body, id: 'new-block' };
      rows.unshift(row);
      return reply(row, 201);
    }
    rows = rows.map(row => row.id === id ? { ...row, ...body } : row);
    return reply(rows.find(row => row.id === id));
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const visible = async locator => { await locator.waitFor({ state: 'visible' }); };
  const login = role => context.addCookies([
    { name: 'token', value: 'test-token', url: base },
    { name: 'auth', value: JSON.stringify({ id: 'admin-test', name: 'Test Admin', role }), url: base },
  ]);
  try {
    await page.goto(`${base}/route-blocks`);
    await page.waitForURL(url => url.pathname === '/login');
    console.log('PASS unauthenticated route redirects to login');
    await login('DRIVER');
    await page.goto(`${base}/route-blocks`);
    await visible(page.getByRole('alert').filter({ hasText: 'Administrator access is required.' }));
    assert.equal(requests.length, 0);
    console.log('PASS non-admin UI is denied before API requests');
    await login('ADMIN');
    await page.goto(`${base}/route-blocks`);
    await visible(page.getByText('21 blocks · Page 1 of 2'));
    assert.equal(await page.locator('tbody tr').count(), 20);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await visible(page.getByText('21 blocks · Page 2 of 2'));
    assert.equal(await page.locator('tbody tr').count(), 1);
    await page.getByLabel('From country', { exact: true }).selectOption('FR');
    await visible(page.getByText('No blocks match this view.', { exact: false }));
    assert.equal(requests.at(-1).url.searchParams.get('page'), '1');
    await page.getByLabel('To country', { exact: true }).selectOption('CH');
    await page.getByLabel('Transport type', { exact: true }).selectOption('FURNITURE_TRANSPORT');
    await page.getByLabel('Status', { exact: true }).selectOption('false');
    await page.waitForResponse(response => response.url().includes('isActive=false'));
    const filter = requests.at(-1).url.searchParams;
    assert.equal(filter.get('toCountryCode'), 'CH');
    assert.equal(filter.get('transportType'), 'FURNITURE_TRANSPORT');
    assert.equal(filter.get('isActive'), 'false');
    console.log('PASS pagination and all four server filters');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await visible(page.getByText('21 blocks · Page 1 of 2'));
    await page.getByRole('button', { name: 'Deactivate', exact: true }).first().click();
    await visible(page.getByRole('alertdialog'));
    const writesBeforeCancel = requests.filter(r => r.method !== 'GET').length;
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(requests.filter(r => r.method !== 'GET').length, writesBeforeCancel);
    await page.getByRole('button', { name: 'Deactivate', exact: true }).first().click();
    await page.getByRole('button', { name: 'Confirm and save' }).click();
    await visible(page.getByRole('button', { name: 'Activate', exact: true }).first());
    assert.deepEqual(requests.find(r => r.method === 'PATCH').body, { isActive: false });
    duplicate = true;
    await page.getByRole('button', { name: 'Activate', exact: true }).first().click();
    await page.getByRole('button', { name: 'Confirm and save' }).click();
    await visible(page.getByRole('alertdialog').getByRole('alert'));
    assert.match(await page.getByRole('alertdialog').innerText(), /active block already exists/);
    duplicate = false;
    await page.getByRole('button', { name: 'Confirm and save' }).click();
    await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
    console.log('PASS cancel, deactivate, duplicate reactivation, and successful retry');
    await page.goto(`${base}/route-blocks/create`);
    await page.getByLabel('From country', { exact: true }).selectOption('FR');
    await page.getByLabel('To country', { exact: true }).selectOption('CH');
    await page.getByLabel('Transport type', { exact: true }).selectOption('FURNITURE_TRANSPORT');
    await page.getByLabel('Internal reason', { exact: false }).fill('Furniture restriction');
    await page.getByRole('button', { name: 'Review changes' }).click();
    assert.match(await page.getByRole('alertdialog').innerText(), /France \(FR\) → Switzerland \(CH\)/);
    assert.match(await page.getByRole('alertdialog').innerText(), /Furniture/);
    assert.match(await page.getByRole('alertdialog').innerText(), /will not be cancelled automatically/);
    await page.getByRole('button', { name: 'Confirm and save' }).click();
    await page.waitForURL(`${base}/route-blocks`);
    assert.deepEqual(requests.find(r => r.method === 'POST').body, { fromCountryCode: 'FR', toCountryCode: 'CH', transportType: 'FURNITURE_TRANSPORT', reason: 'Furniture restriction', isActive: true });
    console.log('PASS create payload and explicit directional/lifecycle confirmation');
    await page.goto(`${base}/route-blocks/edit/new-block`);
    await page.getByLabel('To country', { exact: true }).selectOption('FR');
    await page.getByLabel('Transport type', { exact: true }).selectOption('');
    await page.getByLabel('Internal reason', { exact: false }).fill('');
    await page.getByRole('button', { name: 'Review changes' }).click();
    assert.match(await page.getByRole('alertdialog').innerText(), /All transport types/);
    await page.getByRole('button', { name: 'Confirm and save' }).click();
    await page.waitForURL(`${base}/route-blocks`);
    const updated = rows.find(row => row.id === 'new-block');
    assert.equal(updated.toCountryCode, 'FR');
    assert.equal(updated.transportType, null);
    assert.equal(updated.reason, null);
    assert.ok(requests.every(request => request.authorization === 'Bearer test-token'));
    console.log('PASS edit, same-country block, null all-types/reason, and existing auth token');
    await page.goto(`${base}/route-blocks/edit/missing`);
    await visible(page.getByRole('alert').getByText('Route block not found.', { exact: true }));
    failList = true;
    await page.goto(`${base}/route-blocks`);
    await visible(page.getByRole('alert').filter({ hasText: 'Administrator access is required.' }));
    failList = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await visible(page.getByText('22 blocks · Page 1 of 2'));
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile page must not overflow horizontally');
    assert.deepEqual(errors, []);
    console.log('PASS missing record, API permission error/retry, mobile width, no runtime errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
