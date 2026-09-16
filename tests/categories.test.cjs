const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApi } = require('../server/app');
const { classification, validId } = require('../server/categories');
const { categoryRequest, validateCategories } = require('../api-client');

async function withApi(t, query) {
  const api = createApi({ query });
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  t.after(() => new Promise(resolve => { api.close(resolve); api.closeAllConnections(); }));
  return `http://127.0.0.1:${api.address().port}`;
}
const write = (base, route, body, method = 'POST') => fetch(`${base}/api/${route}`, {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('clasificación acepta ausencia y valida IDs positivos y dependencia de rubro', () => {
  assert.deepEqual(classification({ categoryId: null, subcategoryId: null }), { categoryId: null, subcategoryId: null });
  assert.equal(validId('9223372036854775807'), true);
  for (const id of ['0', '-1', '1.2', '9223372036854775808', 1]) assert.equal(validId(id), false);
  assert.throws(() => classification({ categoryId: null, subcategoryId: '1' }));
  assert.throws(() => classification({ categoryId: '1' }));
});

test('lista rubros/subcategorías desde una consulta y permite lista vacía', async t => {
  const base = await withApi(t, async sql => {
    assert.match(sql, /UNION ALL/);
    return { rows: [] };
  });
  const response = await fetch(`${base}/api/categories`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { categories: [], subcategories: [] });
});

test('crea y renombra por ID con nombres parametrizados y original esperado', async t => {
  const base = await withApi(t, async (sql, params) => {
    assert.doesNotMatch(sql, /Papelera|Papelería/);
    if (sql.includes('UPDATE')) {
      assert.deepEqual(params, ['1', 'Papelería', 'Papelera']);
      assert.match(sql, /name=\$3/);
    } else assert.deepEqual(params, ['Papelera']);
    return { rows: [{ id: '1', name: params[1] || params[0] }] };
  });
  assert.equal((await write(base, 'categories', { name: ' Papelera ' })).status, 201);
  assert.equal((await write(base, 'categories/1', { name: 'Papelería', expectedName: 'Papelera' }, 'PATCH')).status, 200);
});

test('nombres inválidos, campos ajenos, traslado y borrado no llegan a SQL', async t => {
  let calls = 0;
  const base = await withApi(t, async () => { calls++; return { rows: [] }; });
  for (const body of [null, { name: '' }, { name: ' ' }, { name: 'x'.repeat(81) }, { name: 'A', id: '1' }]) {
    assert.equal((await write(base, 'categories', body)).status, 400);
  }
  assert.equal((await write(base, 'subcategories', { name: 'A', categoryId: '-1' })).status, 400);
  assert.equal((await write(base, 'subcategories/1', { name: 'A', expectedName: 'B', categoryId: '2' }, 'PATCH')).status, 400);
  assert.equal((await fetch(`${base}/api/categories/1`, { method: 'DELETE' })).status, 405);
  assert.equal((await fetch(`${base}/api/categories`, { headers: { Origin: 'https://example.com' } })).status, 403);
  assert.equal(calls, 0);
});

test('conflictos, padre inexistente y permisos generan errores seguros', async t => {
  let code = null;
  const base = await withApi(t, async () => {
    if (code) throw Object.assign(new Error('secreto'), { code });
    return { rows: [] };
  });
  for (const [error, status] of [[null, 409], ['23505', 409], ['23503', 400], ['42501', 403], ['otro', 503]]) {
    code = error;
    const response = await write(base, 'categories/1', { name: 'A', expectedName: 'B' }, 'PATCH');
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /secreto/);
  }
});

test('cliente limita rutas, valida padres y no muestra errores internos', async () => {
  const data = { categories: [{ id: '1', name: 'Repostería' }], subcategories: [{ id: '1', name: 'Insumos', categoryId: '1' }] };
  assert.deepEqual(validateCategories(data), data);
  assert.throws(() => validateCategories({ ...data, categories: [] }));
  assert.throws(() => validateCategories({ ...data, categories: [data.categories[0], data.categories[0]] }));
  assert.equal((await categoryRequest('https://example.com')).ok, false);
  const result = await categoryRequest('categories', null, undefined, { fetchImpl: async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:3000/api/categories');
    assert.equal(options.method, 'GET');
    return { ok: true, json: async () => data };
  } });
  assert.equal(result.ok, true);
  const saved = await categoryRequest('categories', '1', { name: 'A', expectedName: 'B' }, { fetchImpl: async (url, options) => {
    assert.equal(options.method, 'PATCH');
    return { ok: true, json: async () => ({ item: { id: '2', name: 'A' } }) };
  } });
  assert.equal(saved.ok, false);
});
