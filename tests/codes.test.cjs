const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApi } = require('../server/app');
const { cleanCode } = require('../server/codes');
const { codeRequest } = require('../api-client');

async function withApi(t, query) {
  const server = createApi({ query });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}
const post = (base, body) => fetch(`${base}/api/products/1/codes`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('códigos conservan ceros y letras; rechazan números JS, vacíos y controles', () => {
  for (const value of ['00123', 'Aa-005', '<script>', "x' OR 1=1"]) assert.equal(cleanCode(` ${value} `), value);
  for (const value of [123, null, '', ' ', 'x'.repeat(101), 'a\nb', 'a\u0000b']) assert.throws(() => cleanCode(value));
});

test('alta parametrizada y reintento para el mismo producto no duplican', async t => {
  let first = true;
  const item = { id: '5', productId: '1', code: '00123' };
  const base = await withApi(t, async (sql, params) => {
    assert.deepEqual(params, ['1', '00123']);
    assert.doesNotMatch(sql, /00123/);
    if (sql.includes('INSERT')) { const rows = first ? [item] : []; first = false; return { rows }; }
    return { rows: [item] };
  });
  assert.equal((await post(base, { code: ' 00123 ' })).status, 201);
  const response = await post(base, { code: '00123' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { item });
});

test('código ajeno genera conflicto y no se reasigna', async t => {
  const base = await withApi(t, async sql => { assert.doesNotMatch(sql, /UPDATE/); return { rows: [] }; });
  assert.equal((await post(base, { code: '00123' })).status, 409);
});

test('validación, métodos y origen impiden consultas no autorizadas', async t => {
  let calls = 0;
  const base = await withApi(t, async () => { calls++; return { rows: [] }; });
  for (const body of [null, { code: 123 }, { code: '' }, { code: 'A', stock: 2 }]) assert.equal((await post(base, body)).status, 400);
  assert.equal((await fetch(`${base}/api/products/by-code`)).status, 400);
  assert.equal((await fetch(`${base}/api/products/1/codes`, { method: 'PATCH' })).status, 405);
  assert.equal((await fetch(`${base}/api/products/1/codes`, { headers: { Origin: 'https://example.com' } })).status, 403);
  assert.equal(calls, 0);
});

test('quitar desactiva por ID y producto, sin tocar productos ni movimientos', async t => {
  const base = await withApi(t, async (sql, params) => {
    assert.match(sql, /SET active=false/);
    assert.match(sql, /product_id=\$1 AND id=\$2/);
    assert.deepEqual(params, ['1', '9']);
    return { rows: [{ id: '9' }] };
  });
  const response = await fetch(`${base}/api/products/1/codes/9`, { method: 'DELETE' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { removed: true });
});

test('búsqueda exacta consulta base completa y errores no filtran SQL', async t => {
  let fail = false;
  const base = await withApi(t, async (sql, params) => {
    if (fail) throw Object.assign(new Error('PASSWORD secreto'), { code: '42P01' });
    assert.match(sql, /c.code=\$1 AND c.active/);
    assert.doesNotMatch(sql, /LIMIT|afterId/);
    assert.deepEqual(params, ['00123']);
    return { rows: [] };
  });
  assert.deepEqual(await (await fetch(`${base}/api/products/by-code?code=00123`)).json(), { product: null });
  fail = true;
  const response = await fetch(`${base}/api/products/1/codes`);
  assert.equal(response.status, 403);
  assert.doesNotMatch(await response.text(), /PASSWORD|secreto/);
});

test('cliente fija rutas, codifica búsqueda y valida identidad de asociación', async () => {
  const fetchImpl = async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:3000/api/products/by-code?code=A%2F00%26');
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => ({ product: null }) };
  };
  assert.equal((await codeRequest('find', null, 'A/00&', { fetchImpl })).ok, true);
  for (const args of [['other', '1'], ['list', '0'], ['remove', '1', '../2'], ['add', '1', 123]]) {
    assert.equal((await codeRequest(...args)).ok, false);
  }
  assert.equal((await codeRequest('add', '1', '00123', { fetchImpl: async () => ({ ok: true,
    json: async () => ({ item: { id: '1', productId: '2', code: '00123' } }) }) })).ok, false);
  assert.equal((await codeRequest('find', null, '00123', { fetchImpl: async () => ({ ok: true,
    json: async () => ({}) }) })).ok, false);
});
