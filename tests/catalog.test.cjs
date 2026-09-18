const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const product = { id: '1', name: 'Caja de pizza', costPrice: '1000.00', salePrice: '1600.00',
  markupPercentage: '50.00', stock: '-1', unit: 'UNIT', active: false };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('igualdad manual o por porcentaje cero bloquea Guardar y Enter sin subir el precio', async () => {
  let saves = 0;
  const { elements, document } = setup(async () => ({ ok: true, products: [product], nextAfterId: null }), async () => { saves++; });
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  const form = elements.get('#product-form');
  for (const [id, value] of [['#product-sale-price', '1000'], ['#product-markup', '0']]) {
    const target = document.querySelector(id);
    target.value = value;
    form.listeners.input({ target });
    assert.equal(elements.get('#save-product').disabled, true);
    assert.equal(Number(document.querySelector('#product-sale-price').value), 1000);
    await form.listeners.submit({ preventDefault() {} });
    assert.match(elements.get('#form-error').textContent, /mayor que el costo/);
  }
  assert.equal(saves, 0);
});

test('costo mantiene porcentaje y recalcula venta; venta manual actualiza porcentaje', async () => {
  const { elements, document } = setup(async () => ({ ok: true, products: [product], nextAfterId: null }));
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  const change = (field, value) => {
    const target = document.querySelector(`#product-${field}`);
    target.value = value;
    elements.get('#product-form').listeners.input({ target });
  };
  assert.equal(document.querySelector('#product-markup').disabled, false);
  change('markup', '50');
  assert.equal(document.querySelector('#product-sale-price').value, '1500.00');
  change('sale-price', '1900');
  assert.equal(document.querySelector('#product-markup').value, '90.00');
  change('cost-price', '1220');
  assert.equal(document.querySelector('#product-sale-price').value, '2318.00');
  assert.equal(document.querySelector('#product-markup').value, '90.00');
  change('cost-price', '');
  assert.equal(document.querySelector('#product-markup').value, '90.00');
  assert.equal(elements.get('#save-product').disabled, true);
  change('cost-price', '2000');
  assert.equal(document.querySelector('#product-sale-price').value, '3800.00');
  assert.equal(document.querySelector('#product-markup').value, '90.00');
  change('cost-price', '0');
  assert.equal(document.querySelector('#product-sale-price').value, '3800.00');
  assert.equal(document.querySelector('#product-markup').value, '');
  assert.equal(document.querySelector('#product-markup').disabled, true);
});

test('porcentaje inválido conserva precio pero bloquea Guardar y Enter hasta corregir o cancelar', async () => {
  let saves = 0;
  const { elements, document } = setup(async () => ({ ok: true, products: [product], nextAfterId: null }), async () => { saves++; });
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  const field = document.querySelector('#product-markup');
  field.value = '-1';
  elements.get('#product-form').listeners.input({ target: field });
  assert.equal(document.querySelector('#product-sale-price').value, product.salePrice);
  assert.equal(elements.get('#save-product').disabled, true);
  const name = document.querySelector('#product-name');
  name.value = 'Otra caja';
  elements.get('#product-form').listeners.input({ target: name });
  await elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(saves, 0);
  assert.match(elements.get('#form-error').textContent, /porcentaje/);
  elements.get('#cancel-product').listeners.click();
  assert.equal(field.value, '50.00');
});

test('Nuevo habilita stock y unidad, valida y reintenta con la misma clave sin duplicar', async () => {
  let attempts = 0;
  const keys = [];
  const { elements, document, context } = setup(async () => ({ ok: true, products: [], nextAfterId: null }), undefined,
    async changes => {
      keys.push(changes.requestId);
      attempts++;
      if (attempts === 1) return { ok: false, error: 'Respuesta perdida' };
      return { ok: true, product: { ...product, id: '9', name: changes.name, unit: changes.unit, stock: changes.stock } };
    });
  await settle();
  elements.get('#new-product').listeners.click();
  assert.equal(document.querySelector('#product-stock').disabled, false);
  assert.equal(document.querySelector('#product-unit').disabled, false);
  for (const [field, value] of [['name', 'Azúcar'], ['cost-price', '1000'], ['sale-price', '1600'], ['stock', '1.2']]) {
    document.querySelector(`#product-${field}`).value = value;
  }
  const form = elements.get('#product-form');
  form.listeners.input();
  assert.equal(elements.get('#save-product').disabled, true);
  document.querySelector('#product-unit').value = 'KILOGRAM';
  form.listeners.input();
  assert.equal(elements.get('#save-product').disabled, false);
  await form.listeners.submit({ preventDefault() {} });
  assert.equal(vm.runInContext('catalog.length', context), 0);
  await elements.get('#refresh-products').listeners.click();
  assert.equal(document.querySelector('#product-name').value, 'Azúcar');
  await form.listeners.submit({ preventDefault() {} });
  assert.equal(keys[0], keys[1]);
  assert.equal(vm.runInContext('catalog.length', context), 1);
  assert.equal(document.querySelector('#product-stock').disabled, true);
  assert.match(elements.get('#product-form-status').textContent, /Stock inicial/);
  await form.listeners.submit({ preventDefault() {} });
  assert.equal(attempts, 2);
});

test('Cancelar alta no crea datos y Nuevo no descarta una edición pendiente', async () => {
  const { elements, document, context } = setup(async () => ({ ok: true, products: [product], nextAfterId: null }));
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  document.querySelector('#product-name').value = 'Cambio pendiente';
  elements.get('#new-product').listeners.click();
  assert.equal(document.querySelector('#product-name').value, 'Cambio pendiente');
  elements.get('#cancel-product').listeners.click();
  elements.get('#new-product').listeners.click();
  elements.get('#cancel-product').listeners.click();
  assert.equal(vm.runInContext('catalog.length', context), 1);
  assert.equal(document.querySelector('#product-stock').disabled, true);
});

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
  assert.match(elements.get('#form-error').textContent, /mayor/);
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

function setup(listProducts, saveProduct, createProduct) {
  const elements = new Map();
  function element() {
    return { value: '', children: [], listeners: {}, attributes: {},
      set innerHTML(value) { this.children = []; },
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      append(child) { this.children.push(child); },
      querySelectorAll() { return this.children.flatMap(child => child.children); },
      reset() { for (const [key, field] of elements) if (key.startsWith('#product-') && key !== '#product-search') field.value = ''; },
    };
  }
  const document = { querySelector(key) {
    if (!elements.has(key)) elements.set(key, element());
    return elements.get(key);
  }, createElement: element };
  const context = vm.createContext({ document, crypto: require('node:crypto'), window: {
    stockizi: { listProducts, saveProduct, createProduct },
    stockiziCodes: { setEnabled() {}, init(actions) { this.actions = actions; } },
  } });
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

test('código inexistente vacía solo resultados, conserva ficha y Actualizar recupera listado', async () => {
  const { elements, document, context } = setup(async () => ({ ok: true, products: [product], nextAfterId: '1' }));
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  context.window.stockiziCodes.actions.notFound();
  assert.equal(elements.get('#products-list').children.length, 0);
  assert.equal(elements.get('#load-more-products').hidden, true);
  assert.equal(document.querySelector('#product-name').value, product.name);
  assert.equal(context.window.stockiziCodes.actions.getProduct().id, product.id);
  assert.match(elements.get('#results-summary').textContent, /Sin resultados/);
  document.querySelector('#product-name').value = 'Borrador';
  assert.equal(context.window.stockiziCodes.actions.canLeave(), false);
  assert.equal(document.querySelector('#product-name').value, 'Borrador');
  elements.get('#cancel-product').listeners.click();
  assert.equal(elements.get('#products-list').children.length, 0);
  await elements.get('#refresh-products').listeners.click();
  assert.equal(elements.get('#products-list').children.length, 1);
  assert.equal(elements.get('#load-more-products').hidden, false);
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

test('cargar más conserva filtros aplicados; Buscar reinicia y no filtra localmente', async () => {
  const cursors = [];
  const { elements } = setup(async (cursor, filters) => {
    cursors.push([cursor, filters.name]);
    if (filters.name) return { ok: true, products: [{ ...product, id: '150', name: 'Azúcar' }], nextAfterId: null };
    return cursor === '0' ? { ok: true, products: [product], nextAfterId: '1' }
      : { ok: true, products: [{ ...product, id: '2', name: 'Azúcar' }], nextAfterId: null };
  });
  await settle();
  assert.match(elements.get('#results-summary').textContent, /toda la base/);
  elements.get('#product-search').value = 'AZUCAR';
  elements.get('#product-search').listeners.input();
  await elements.get('#load-more-products').listeners.click();
  assert.equal(elements.get('#products-list').children.length, 2);
  assert.match(elements.get('#search-status').textContent, /pendientes/);
  await elements.get('#catalog-search-form').listeners.submit({ preventDefault() {} });
  assert.equal(elements.get('#products-list').children.length, 1);
  await elements.get('#refresh-products').listeners.click();
  assert.deepEqual(cursors, [['0', ''], ['1', ''], ['0', 'AZUCAR'], ['0', 'AZUCAR']]);
});

test('búsqueda fallida conserva lista y borrador bloquea Buscar', async () => {
  let calls = 0;
  const { elements, document } = setup(async () => ++calls === 1
    ? { ok: true, products: [product], nextAfterId: null } : { ok: false });
  await settle();
  elements.get('#products-list').children[0].children[0].listeners.click();
  document.querySelector('#product-name').value = 'Borrador';
  document.querySelector('#product-search').value = 'Otra búsqueda';
  await elements.get('#catalog-search-form').listeners.submit({ preventDefault() {} });
  assert.equal(calls, 1);
  assert.equal(document.querySelector('#product-name').value, 'Borrador');
  elements.get('#cancel-product').listeners.click();
  await elements.get('#catalog-search-form').listeners.submit({ preventDefault() {} });
  assert.equal(calls, 2);
  assert.equal(elements.get('#products-list').children.length, 1);
  assert.match(elements.get('#connection-status').textContent, /última consulta/);
});
