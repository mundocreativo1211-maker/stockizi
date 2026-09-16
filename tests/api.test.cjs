const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const http = require('node:http');
const { createApi } = require('../server/app');
const { listProducts } = require('../server/products');
const { readConfig } = require('../server/database');
const { randomUUID } = require('node:crypto');

test('POST crea con SQL parametrizado y normaliza stock, devuelve 201 o reintento 200', async t => {
  let inserted = false;
  const body = { name: 'Azúcar', costPrice: '1220', salePrice: '1900', unit: 'KILOGRAM', stock: '1.200', requestId: randomUUID() };
  const base = await withApi(t, async (sql, values) => {
    if (sql.includes('INSERT INTO')) {
      assert.match(sql, /ON CONFLICT \(creation_key\) DO NOTHING/);
      assert.deepEqual(values.slice(0, 7), ['Azúcar', '1220.00', '1900.00', '55.74', 'KILOGRAM', '1.2', body.requestId]);
      if (inserted) return { rows: [] };
      inserted = true;
    } else {
      assert.match(sql, /creation_payload = \$2::jsonb/);
    }
    return { rows: [{ id: '2' }] };
  });
  const post = () => fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post()).status, 201);
  assert.equal((await post()).status, 200);
});

test('POST rechaza datos inválidos sin consultar y protege origen', async t => {
  let calls = 0;
  const base = await withApi(t, async () => { calls++; return { rows: [] }; });
  const valid = { name: 'Caja', costPrice: '1', salePrice: '2', unit: 'UNIT', stock: '20', requestId: randomUUID() };
  const post = (body, extra = {}) => fetch(`${base}/api/products`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });
  for (const change of [{ stock: '1.2' }, { stock: '-1' }, { stock: '1.0001' }, { salePrice: '0' },
    { requestId: 'malo' }, { active: true }, { unit: 'X' }]) {
    assert.equal((await post({ ...valid, ...change })).status, 400);
  }
  assert.equal((await post(valid, { Origin: 'https://example.com' })).status, 403);
  assert.equal(calls, 0);
});

test('POST responde conflicto de clave, migración faltante o fallo sin filtrar SQL', async t => {
  let code = null;
  const base = await withApi(t, async () => {
    if (code) throw Object.assign(new Error('secreto'), { code });
    return { rows: [] };
  });
  const body = { name: 'Caja', costPrice: '1', salePrice: '2', unit: 'UNIT', stock: '0', requestId: randomUUID() };
  for (const [error, status] of [[null, 409], ['42703', 403], ['42501', 403], ['23514', 503]]) {
    code = error;
    const response = await fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /secreto/);
  }
});

async function withApi(t, query) {
  const server = createApi({ query });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('GET devuelve productos sin convertir decimales ni identificadores a Number', async t => {
  const row = { id: '9007199254740993', name: 'Azúcar', stock: '-1.200', salePrice: '1500.10' };
  const base = await withApi(t, async (sql, values) => {
    assert.match(sql, /SELECT/);
    assert.match(sql, /ORDER BY public\.products\.id/);
    assert.deepEqual(values, ['0', 101]);
    return { rows: [row] };
  });
  const response = await fetch(`${base}/api/products`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await response.json(), { products: [row], nextAfterId: null });
});

test('catálogo vacío no es un error', async t => {
  const base = await withApi(t, async () => ({ rows: [] }));
  assert.deepEqual(await (await fetch(`${base}/api/products`)).json(), { products: [], nextAfterId: null });
});

test('pagina de a 100 y pasa el cursor como parámetro SQL', async () => {
  const rows = Array.from({ length: 101 }, (_, i) => ({ id: String(i + 11) }));
  const result = await listProducts({ query: async (sql, values) => {
    assert.deepEqual(values, ['10', 101]);
    assert.match(sql, /WHERE id > \$1/);
    return { rows };
  } }, '10');
  assert.equal(result.products.length, 100);
  assert.equal(result.nextAfterId, '110');
});

test('rechaza métodos de escritura, rutas inexistentes y cursores inválidos sin consultar', async t => {
  const base = await withApi(t, async () => { throw new Error('No debería consultar'); });
  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    const response = await fetch(`${base}/api/products`, { method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, POST');
  }
  assert.equal((await fetch(`${base}/otra`)).status, 404);
  for (const afterId of ['-1', '1.2', '9223372036854775808', '1;DROP TABLE products']) {
    assert.equal((await fetch(`${base}/api/products?afterId=${encodeURIComponent(afterId)}`)).status, 400);
  }
});

test('no filtra errores SQL ni secretos al fallar PostgreSQL', async t => {
  const base = await withApi(t, async () => { throw new Error('contraseña-secreta'); });
  const response = await fetch(`${base}/api/products`);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /contraseña-secreta/);
});

test('rechaza páginas externas y hosts ajenos', async t => {
  const base = await withApi(t, async () => ({ rows: [] }));
  assert.equal((await fetch(`${base}/api/products`, { headers: { Origin: 'https://example.com' } })).status, 403);
  // fetch normaliza Host: usamos HTTP directo para probar un encabezado ajeno.
  const status = await new Promise((resolve, reject) => {
    const request = http.get(`${base}/api/products`, { headers: { Host: 'example.com' } }, response => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on('error', reject);
  });
  assert.equal(status, 403);
});

test('configuración exige credenciales, puertos válidos y conexión local sin administrador', () => {
  const env = { PGDATABASE: 'stockizi', PGUSER: 'stockizi_reader', PGPASSWORD: 'solo-prueba' };
  const config = readConfig(env);
  assert.equal(config.database.port, 5432);
  assert.equal(config.apiPort, 3000);
  assert.equal(config.database.options, '-c default_transaction_read_only=on');
  assert.equal(readConfig({ ...env, PGUSER: 'stockizi_editor' }).database.options, '-c default_transaction_read_only=off');
  for (const changes of [{ PGPASSWORD: '' }, { PGUSER: 'postgres' }, { PGHOST: 'example.com' }, { PGPORT: 'abc' }, { API_PORT: '70000' }]) {
    assert.throws(() => readConfig({ ...env, ...changes }));
  }
});

const changes = { name: 'Caja 12', costPrice: '1220', salePrice: '1900',
  expected: { name: 'Caja', costPrice: '1000.00', salePrice: '1500.00' } };
const patch = (base, body = changes, headers = { 'Content-Type': 'application/json' }) =>
  fetch(`${base}/api/products/1`, { method: 'PATCH', headers, body: JSON.stringify(body) });

test('PATCH parametriza cambios y originales, recalcula porcentaje y no escribe stock', async t => {
  const base = await withApi(t, async (sql, values) => {
    assert.match(sql, /UPDATE public.products/);
    assert.doesNotMatch(sql.split('WHERE')[0], /stock\s*=/);
    assert.match(sql, /AND name = \$6 AND cost_price = \$7 AND sale_price = \$8/);
    assert.deepEqual(values, ['1', 'Caja 12', '1220.00', '1900.00', '55.74', 'Caja', '1000.00', '1500.00']);
    return { rows: [{ id: '1', markupPercentage: values[4] }] };
  });
  const response = await patch(base);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).product.markupPercentage, '55.74');
});

test('PATCH rechaza bajo costo, campos ajenos, JSON inválido y cuerpos grandes sin tocar SQL', async t => {
  let calls = 0;
  const base = await withApi(t, async () => { calls++; return { rows: [] }; });
  for (const body of [null, {}, { ...changes, salePrice: '1000' }, { ...changes, stock: '20' },
    { ...changes, costPrice: '1.001' }, { ...changes, expected: {} }, { ...changes, markupPercentage: '1' }]) {
    assert.equal((await patch(base, body)).status, 400);
  }
  assert.equal((await patch(base, changes, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await patch(base, { ...changes, name: 'x'.repeat(9000) })).status, 413);
  assert.equal((await fetch(`${base}/api/products/1`, { method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await patch(base, changes, { 'Content-Type': 'application/json', Origin: 'https://example.com' })).status, 403);
  assert.equal(calls, 0);
});

test('PATCH distingue conflicto, permisos y error sin revelar SQL', async t => {
  let code = null;
  const base = await withApi(t, async () => {
    if (!code) return { rows: [] };
    throw Object.assign(new Error('secreto'), { code });
  });
  assert.equal((await patch(base)).status, 409);
  for (const [value, status] of [['42501', 403], ['25006', 403], ['otro', 503]]) {
    code = value;
    const response = await patch(base);
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /secreto/);
  }
});
