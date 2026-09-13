const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// DOM mínimo de prueba: no abre Electron ni guarda productos reales.
function createInterface() {
  const elements = new Map();
  const context = vm.createContext({
    document: {
      querySelector(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, {
            value: selector === '#product-unit' ? 'UNIT' : '',
            get valueAsNumber() {
              return this.value === '' ? NaN : Number(this.value);
            },
            listeners: {},
            addEventListener(event, callback) { this.listeners[event] = callback; },
            append() {},
            reset() { elements.get('#product-unit').value = 'UNIT'; },
          });
        }
        return elements.get(selector);
      },
      createElement() { return {}; },
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
