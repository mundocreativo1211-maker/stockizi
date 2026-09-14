const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// DOM mínimo de prueba: no abre Electron ni guarda productos reales.
function createInterface() {
  const elements = new Map();
  function makeElement(value = '') {
    return {
      value, children: [], attributes: {}, listeners: {}, validity: { valid: true },
      get valueAsNumber() { return this.value === '' ? NaN : Number(this.value); },
      set innerHTML(value) { this.children = []; },
      addEventListener(event, callback) { this.listeners[event] = callback; },
      append(child) { this.children.push(child); },
      setAttribute(name, value) { this.attributes[name] = value; },
      focus() {},
      reportValidity() { return true; },
      showModal() { this.open = true; },
      close() { this.open = false; },
      reset() {
        for (const [selector, element] of elements) {
          if (selector.startsWith('#product-')) element.value = selector === '#product-unit' ? 'UNIT' : '';
        }
      },
    };
  }
  const context = vm.createContext({
    document: {
      querySelector(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, makeElement(selector === '#product-unit' ? 'UNIT' : ''));
        }
        return elements.get(selector);
      },
      createElement() { return makeElement(); },
    },
  });
  const source = fs.readFileSync(path.join(__dirname, '..', 'renderer.js'), 'utf8');
  vm.runInContext(source, context);
  return { context, elements };
}

const validProduct = {
  name: 'Caja 20 x 30', costPrice: 2000, markupPercentage: 30,
  salePrice: 2650, stock: 2, unit: 'UNIT',
};

test('combina nombre y rubro, ignora tildes y conserva el catálogo', () => {
  const { context } = createInterface();
  context.catalog = [
    { name: 'Azúcar 1 kg', categoryId: 'baking' },
    { name: 'Caja 20 azul', categoryId: 'paper' },
    { name: 'Caja 20 fiesta', categoryId: 'party' },
    { name: 'Martillo' },
  ];
  assert.equal(vm.runInContext("filterProducts(catalog, ' AZUCAR ', 'baking').length", context), 1);
  assert.equal(vm.runInContext("filterProducts(catalog, 'caja 20', 'paper')[0].name", context), 'Caja 20 azul');
  assert.equal(vm.runInContext("filterProducts(catalog, 'azucar', 'party').length", context), 0);
  assert.equal(vm.runInContext("filterProducts(catalog, '', 'uncategorized')[0].name", context), 'Martillo');
  assert.equal(vm.runInContext("filterProducts(catalog, '', '').length", context), 4);
  assert.equal(context.catalog.length, 4);
});

test('calcula el markup sobre costo', () => {
  const { context } = createInterface();
  assert.equal(vm.runInContext('calculateSalePrice(2000, 30)', context), 2600);
});

test('rubros propios, subcategorías y renombrado conservan identificadores', () => {
  const { context } = createInterface();
  assert.equal(vm.runInContext('categories.length', context), 0);
  assert.equal(vm.runInContext("saveCategory('', 'Repostería', null)", context), '');
  assert.notEqual(vm.runInContext("saveCategory('', ' reposteria ', null)", context), '');
  assert.equal(vm.runInContext("saveCategory('', 'Bandejas', 'category-1')", context), '');
  context.productToTest = { ...validProduct, categoryId: 'category-1', subcategoryId: 'category-2' };
  assert.equal(vm.runInContext('validateProduct(productToTest)', context), '');
  assert.equal(vm.runInContext("saveCategory('category-1', 'Repostería y cocina', null)", context), '');
  assert.equal(vm.runInContext('validateProduct(productToTest)', context), '');
  assert.equal(vm.runInContext("categories.find(c => c.id === 'category-2').parentId", context), 'category-1');
  assert.notEqual(vm.runInContext("saveCategory('', 'Otra', 'category-2')", context), '');
  vm.runInContext("saveCategory('', 'Papelera', null)", context);
  context.productToTest.categoryId = 'category-3';
  assert.notEqual(vm.runInContext('validateProduct(productToTest)', context), '');
});

test('editar venta actualiza porcentaje y conserva el precio exacto al guardar', () => {
  const { context, elements } = createInterface();
  elements.get('#product-cost-price').value = '1220';
  elements.get('#product-markup').value = '50';
  elements.get('#product-markup').listeners.input();
  assert.equal(elements.get('#product-sale-price').value, '1830.00');

  elements.get('#product-sale-price').value = '1900';
  elements.get('#product-sale-price').listeners.input();
  assert.equal(elements.get('#product-markup').value, '55.74');
  assert.equal(elements.get('#product-sale-price').value, '1900');

  elements.get('#product-name').value = 'Caja';
  elements.get('#product-stock').value = '1';
  elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(vm.runInContext('products.at(-1).salePrice', context), 1900);
  assert.equal(vm.runInContext('products.at(-1).markupPercentage', context), 55.74);
});

test('no calcula un porcentaje con costo cero o datos vacíos', () => {
  const { elements } = createInterface();
  for (const [cost, sale] of [['0', '1900'], ['', '1900'], ['1220', '']]) {
    elements.get('#product-cost-price').value = cost;
    elements.get('#product-sale-price').value = sale;
    elements.get('#product-markup').value = '50';
    elements.get('#product-sale-price').listeners.input();
    assert.equal(elements.get('#product-markup').value, '');
    assert.equal(elements.get('#product-sale-price').value, sale);
  }
});

test('acepta unidades enteras y peso decimal', () => {
  const { context } = createInterface();
  context.productToTest = validProduct;
  assert.equal(vm.runInContext('validateProduct(productToTest)', context), '');
  context.productToTest = { ...validProduct, stock: 1.2, unit: 'KILOGRAM' };
  assert.equal(vm.runInContext('validateProduct(productToTest)', context), '');
});

test('rechaza datos inválidos', () => {
  const { context } = createInterface();
  for (const changes of [
    { name: '' }, { costPrice: NaN }, { costPrice: -1 },
    { markupPercentage: Infinity }, { markupPercentage: -1 },
    { salePrice: NaN }, { salePrice: -1 }, { stock: -1 },
    { stock: 1.2 }, { unit: 'UNKNOWN' },
  ]) {
    context.productToTest = { ...validProduct, ...changes };
    assert.notEqual(vm.runInContext('validateProduct(productToTest)', context), '');
  }
});

test('un envío inválido conserva la lista y muestra un error', () => {
  const { context, elements } = createInterface();
  elements.get('#product-name').value = '   ';
  elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(vm.runInContext('products.length', context), 2);
  assert.equal(elements.get('#form-error').textContent, 'El producto debe tener un nombre.');
});

test('guarda el precio manual y restaura la regla de unidades', () => {
  const { context, elements } = createInterface();
  vm.runInContext("categories.push({ id: 'baking', name: 'Repostería', parentId: null })", context);
  for (const [selector, value] of Object.entries({
    '#product-name': '  Azúcar  ', '#product-cost-price': '2000',
    '#product-markup': '30', '#product-sale-price': '2650',
    '#product-stock': '1.2', '#product-unit': 'KILOGRAM',
    '#product-category': 'baking', '#product-search': 'no coincide', '#category-filter': 'paper',
  })) elements.get(selector).value = value;
  elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(vm.runInContext('products.at(-1).salePrice', context), 2650);
  assert.equal(vm.runInContext('products.at(-1).name', context), 'Azúcar');
  assert.equal(elements.get('#product-stock').step, '1');
  assert.equal(vm.runInContext('products.at(-1).categoryId', context), 'baking');
  assert.equal(elements.get('#product-search').value, '');
  assert.equal(elements.get('#category-filter').value, '');
});

test('seleccionar carga un borrador y guardar edita sin duplicar ni cambiar el id', () => {
  const { context, elements } = createInterface();
  elements.get('#products-list').children[0].children[0].listeners.click();
  assert.equal(elements.get('#product-name').value, 'Martillo');
  assert.equal(elements.get('#save-product').disabled, true);
  elements.get('#product-name').value = 'Martillo 2';
  elements.get('#product-form').listeners.input();
  assert.equal(elements.get('#save-product').disabled, false);
  assert.equal(vm.runInContext('products[0].name', context), 'Martillo');
  elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(vm.runInContext('products.length', context), 2);
  assert.equal(vm.runInContext('products[0].id', context), 'product-1');
  assert.equal(vm.runInContext('products[0].name', context), 'Martillo 2');
  assert.equal(elements.get('#save-product').disabled, true);
});

test('cambiar de producto permite seguir editando o descartar', () => {
  const { context, elements } = createInterface();
  vm.runInContext("selectProduct('product-1')", context);
  elements.get('#product-name').value = 'Borrador';
  vm.runInContext("selectProduct('product-2')", context);
  assert.equal(elements.get('#discard-dialog').open, true);
  elements.get('#keep-editing').listeners.click();
  assert.equal(elements.get('#product-name').value, 'Borrador');
  vm.runInContext("selectProduct('product-2')", context);
  elements.get('#discard-changes').listeners.click();
  assert.equal(elements.get('#product-name').value, 'Destornillador');
  assert.equal(vm.runInContext('products[0].name', context), 'Martillo');
});

test('cancelar restaura el producto y Nuevo limpia sin modificar el catálogo', () => {
  const { context, elements } = createInterface();
  vm.runInContext("selectProduct('product-1')", context);
  elements.get('#product-stock').value = '999';
  elements.get('#cancel-product').listeners.click();
  elements.get('#discard-changes').listeners.click();
  assert.equal(elements.get('#product-stock').value, '10');
  elements.get('#new-product').listeners.click();
  assert.equal(elements.get('#product-name').value, '');
  assert.equal(elements.get('#product-stock').value, '');
  assert.equal(vm.runInContext('products.length', context), 2);
});

test('Guardar se deshabilita si se restaura el valor o hay errores', () => {
  const { context, elements } = createInterface();
  vm.runInContext("selectProduct('product-1')", context);
  elements.get('#product-name').value = 'Otro';
  elements.get('#product-form').listeners.input();
  assert.equal(elements.get('#save-product').disabled, false);
  elements.get('#product-name').value = 'Martillo';
  elements.get('#product-form').listeners.input();
  assert.equal(elements.get('#save-product').disabled, true);
  elements.get('#product-stock').value = '1.2';
  elements.get('#product-form').listeners.input();
  assert.equal(elements.get('#save-product').disabled, true);
  elements.get('#product-form').listeners.submit({ preventDefault() {} });
  assert.equal(vm.runInContext('products[0].stock', context), 10);
});

test('la selección usa id aunque el catálogo esté filtrado y no recalcula precios', () => {
  const { context, elements } = createInterface();
  vm.runInContext('products[1].salePrice = 4301', context);
  elements.get('#product-search').value = 'destornillador';
  elements.get('#product-search').listeners.input();
  elements.get('#products-list').children[0].children[0].listeners.click();
  assert.equal(elements.get('#product-sale-price').value, '4301');
  assert.equal(vm.runInContext('selectedProductId', context), 'product-2');
});

test('Escape descarta la acción pendiente, no el borrador', () => {
  const { context, elements } = createInterface();
  elements.get('#product-name').value = 'Nuevo sin guardar';
  elements.get('#new-product').listeners.click();
  elements.get('#discard-dialog').listeners.cancel();
  assert.equal(vm.runInContext('pendingFormAction', context), null);
  assert.equal(elements.get('#product-name').value, 'Nuevo sin guardar');
});
