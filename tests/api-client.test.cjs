const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchProductsPage, validatePage, saveProduct } = require('../api-client');
const product = { id: '9007199254740993', name: 'Azúcar', costPrice: '1000.00',
  salePrice: '1500.00', markupPercentage: null, stock: '-1.200', unit: 'KILOGRAM', active: true };

test('guardado usa PATCH local y valida identidad de la respuesta', async () => {
  const result = await saveProduct(product.id, { name: 'Azúcar' }, { fetchImpl: async (url, options) => {
    assert.equal(url, `http://127.0.0.1:3000/api/products/${product.id}`);
    assert.equal(options.method, 'PATCH');
    assert.equal(options.headers['Content-Type'], 'application/json');
    return { ok: true, json: async () => ({ product }) };
  } });
  assert.equal(result.ok, true);
  assert.equal((await saveProduct(product.id, {}, { fetchImpl: async () => ({ ok: true,
    json: async () => ({ product: { ...product, id: '2' } }) }) })).ok, false);
});

test('guardado maneja permisos, conflictos y fallo incierto sin filtrar errores', async () => {
  for (const status of [400, 403, 409, 503]) {
    const result = await saveProduct(product.id, {}, { fetchImpl: async () => ({ ok: false, status,
      json: async () => ({ error: 'secreto' }) }) });
    assert.equal(result.ok, false);
    assert.doesNotMatch(result.error, /secreto/);
  }
  assert.equal((await saveProduct('0', {})).ok, false);
  const result = await saveProduct('1', {}, { fetchImpl: async () => { throw new Error('secreto'); } });
  assert.match(result.error, /confirmar/);
  assert.doesNotMatch(result.error, /secreto/);
});

test('cliente de Electron solo pide GET local y conserva números como texto', async () => {
  const result = await fetchProductsPage('0', { fetchImpl: async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:3000/api/products?afterId=0');
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return { ok: true, json: async () => ({ products: [product], nextAfterId: null }) };
  } });
  assert.equal(result.ok, true);
  assert.equal(result.products[0].id, product.id);
  assert.equal(result.products[0].stock, '-1.200');
});

test('cliente rechaza cursor/puerto inválidos sin enviar solicitudes', async () => {
  const fetchImpl = () => { throw new Error('No debe consultarse'); };
  for (const cursor of ['-1', 'x', 1, '9223372036854775808']) {
    assert.equal((await fetchProductsPage(cursor, { fetchImpl })).ok, false);
  }
  assert.equal((await fetchProductsPage('0', { port: 70000, fetchImpl })).ok, false);
});

test('cliente maneja error HTTP, desconexión, JSON inválido sin exponer detalles', async () => {
  for (const fetchImpl of [
    async () => { throw new Error('secreto'); },
    async () => ({ ok: false }),
    async () => ({ ok: true, json: async () => { throw new Error('json'); } }),
  ]) {
    const result = await fetchProductsPage('0', { fetchImpl });
    assert.equal(result.ok, false);
    assert.doesNotMatch(result.error, /secreto/);
  }
});

test('rechaza páginas repetidas, números no exactos y cursores incoherentes', () => {
  for (const data of [
    { products: [{ ...product, stock: NaN }], nextAfterId: null },
    { products: [product, product], nextAfterId: null },
    { products: [], nextAfterId: '0' },
    { products: [product], nextAfterId: '2' },
    { products: [{ ...product, unit: 'UNKNOWN' }], nextAfterId: null },
  ]) assert.throws(() => validatePage(data, '0'));
});
