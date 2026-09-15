const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const product = { id: '1', name: 'Caja de pizza', costPrice: '1000.00', salePrice: '1600.00',
  markupPercentage: '50.00', stock: '-1', unit: 'UNIT', active: false };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('edición bloquea venta bajo costo, recalcula y confirma solo después de respuesta API', async () => {
  let calls = 0;
  const { elements, document, context } = setup(
    async () => ({ ok: true, products: [product], nextAfterId: null }),
    async (id, changes) => {
      calls++;
      assert.equal(id, '1');
      assert.equal(changes.expected.salePrice, '1600.00');
      assert.equal(changes.salePrice, '1900.00');
      assert.equal(changes.stock, undefined);
      return { ok: true, product: { ...product, salePrice: '1900.00', markupPercentage: '90.00' } };
    });
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  const form = elements.get('#product-form');
  document.querySelector('#product-sale-price').value = '999';
  form.listeners.input();
  assert.equal(elements.get('#save-product').disabled, true);
  await form.listeners.submit({ preventDefault() {} });
  assert.equal(calls, 0);
  assert.match(elements.get('#form-error').textContent, /menor/);
  document.querySelector('#product-sale-price').value = '1900';
  form.listeners.input();
  assert.equal(document.querySelector('#product-markup').value, '90.00');
  assert.equal(elements.get('#save-product').disabled, false);
  await form.listeners.submit({ preventDefault() {} });
  assert.equal(calls, 1);
  assert.equal(vm.runInContext('catalog[0].salePrice', context), '1900.00');
  assert.equal(elements.get('#save-product').disabled, true);
});

test('fallo conserva borrador, bloquea actualización con cambios y Cancelar restaura', async () => {
  const { elements, document, context } = setup(
    async () => ({ ok: true, products: [product], nextAfterId: null }),
    async () => ({ ok: false, error: 'Conflicto de edición' }));
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  document.querySelector('#product-name').value = 'Otra caja';
  elements.get('#product-form').listeners.input();
  await elements.get('#refresh-products').listeners.click();
  assert.equal(document.querySelector('#product-name').value, 'Otra caja');
  await elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(document.querySelector('#product-name').value, 'Otra caja');
  assert.equal(vm.runInContext('catalog[0].name', context), product.name);
  assert.match(elements.get('#form-error').textContent, /Conflicto/);
  elements.get('#cancel-product').listeners.click();
  assert.equal(document.querySelector('#product-name').value, product.name);
});

function setup(listProducts, saveProduct) {
  const elements = new Map();
  function element() {
    return { value: '', children: [], listeners: {}, attributes: {},
      set innerHTML(value) { this.children = []; },
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      append(child) { this.children.push(child); },
      querySelectorAll() { return this.children.flatMap(child => child.children); },
      reset() { for (const [key, field] of elements) if (key.startsWith('#product-')) field.value = ''; },
    };
  }
  const document = { querySelector(key) {
    if (!elements.has(key)) elements.set(key, element());
    return elements.get(key);
  }, createElement: element };
  const context = vm.createContext({ document, window: { stockizi: { listProducts, saveProduct } } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../pricing.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../catalog.js'), 'utf8'), context);
  return { context, elements, document };
}

test('catálogo conectado muestra datos reales, distingue IDs y no recalcula el porcentaje', async () => {
  const { elements, context, document } = setup(async () => ({ ok: true, products: [product], nextAfterId: null }));
  await settle();
  const button = elements.get('#products-list').children[0].children[0];
  assert.match(button.textContent, /#1.*Caja de pizza.*Stock: -1.*Inactivo/);
  button.listeners.click();
  assert.equal(document.querySelector('#product-markup').value, '50.00');
  assert.equal(document.querySelector('#product-sale-price').value, '1600.00');
  let prevented = false;
  elements.get('#product-form').listeners.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(vm.runInContext('catalog.length', context), 1);
});

test('distingue error inicial de catálogo vacío y permite reintentar', async () => {
  let fail = true;
  const { elements } = setup(async () => fail ? { ok: false } : { ok: true, products: [], nextAfterId: null });
  await settle();
  assert.equal(elements.get('#products-list').children.length, 0);
  assert.match(elements.get('#connection-status').textContent, /No se pudo/);
  fail = false;
  await elements.get('#refresh-products').listeners.click();
  assert.equal(elements.get('#results-summary').textContent, 'La base no tiene productos.');
});

test('al fallar actualización conserva selección y advierte que los datos son anteriores', async () => {
  let fail = false;
  const { elements, document } = setup(async () => fail ? { ok: false } : { ok: true, products: [product], nextAfterId: null });
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  fail = true;
  await elements.get('#refresh-products').listeners.click();
  assert.equal(elements.get('#products-list').children.length, 1);
  assert.equal(document.querySelector('#product-name').value, product.name);
  assert.match(elements.get('#connection-status').textContent, /desactualizados/);
});

test('cargar más conserva productos, la búsqueda local avisa su alcance y Actualizar reinicia', async () => {
  const cursors = [];
  const { elements } = setup(async cursor => {
    cursors.push(cursor);
    return cursor === '0' ? { ok: true, products: [product], nextAfterId: '1' }
      : { ok: true, products: [{ ...product, id: '2', name: 'Azúcar' }], nextAfterId: null };
  });
  await settle();
  assert.match(elements.get('#results-summary').textContent, /solo los cargados/);
  await elements.get('#load-more-products').listeners.click();
  assert.equal(elements.get('#products-list').children.length, 2);
  elements.get('#product-search').value = 'AZUCAR';
  elements.get('#product-search').listeners.input();
  assert.equal(elements.get('#products-list').children.length, 1);
  await elements.get('#refresh-products').listeners.click();
  assert.deepEqual(cursors, ['0', '1', '0']);
});
