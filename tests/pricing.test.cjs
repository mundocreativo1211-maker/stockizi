const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, cents, validateInitial, saleFromMarkup } = require('../pricing');

test('porcentaje calcula venta exacta con redondeo y rechaza entradas inválidas', () => {
  assert.equal(saleFromMarkup('1220', '50'), '1830.00');
  assert.equal(saleFromMarkup('0.01', '50'), '0.02');
  assert.equal(saleFromMarkup('100', '0'), '100.00');
  assert.equal(saleFromMarkup('100', '12.34'), '112.34');
  for (const value of ['', '-1', 'NaN', '1e2', '1.001']) assert.throws(() => saleFromMarkup('100', value));
  assert.throws(() => saleFromMarkup('0', '50'), /costo cero/);
  assert.throws(() => saleFromMarkup('9999999999.99', '100'), /límite/);
});

test('stock inicial exacto: unidades enteras y hasta tres decimales para otras medidas', () => {
  const input = { name: 'Caja', costPrice: '1', salePrice: '2', unit: 'UNIT', stock: '20.000' };
  assert.equal(validateInitial(input).stock, '20');
  for (const unit of ['KILOGRAM', 'METER', 'LITER']) {
    assert.equal(validateInitial({ ...input, unit, stock: '001.200' }).stock, '1.2');
  }
  assert.equal(validateInitial({ ...input, stock: '0' }).stock, '0');
  for (const stock of ['1.2', '-1', '1.0001', 'Infinity', 'NaN', '1e2', '', '1000000000000']) {
    assert.throws(() => validateInitial({ ...input, stock }));
  }
  assert.throws(() => validateInitial({ ...input, unit: 'OTRO' }));
});

test('precio menor al costo bloqueado; igualdad y cero permitidos; porcentaje exacto', () => {
  const input = { name: 'Caja 12', costPrice: '1220', salePrice: '1900' };
  assert.equal(validate(input).markupPercentage, '55.74');
  assert.throws(() => validate({ ...input, salePrice: '1219.99' }), /menor/);
  assert.equal(validate({ ...input, salePrice: '1220' }).markupPercentage, '0.00');
  assert.equal(validate({ ...input, costPrice: '0' }).markupPercentage, null);
  assert.equal(cents('9999999999.99'), 999999999999n);
  assert.equal(validate({ ...input, costPrice: '0.10', salePrice: '0.30' }).markupPercentage, '200.00');
});

test('rechaza dinero mal formado, exceso de precisión, nombre vacío y porcentaje fuera de rango', () => {
  for (const costPrice of ['-1', 'NaN', 'Infinity', '1e2', '1.001', '', '10000000000', 1]) {
    assert.throws(() => validate({ name: 'Caja', costPrice, salePrice: '200' }));
  }
  assert.throws(() => validate({ name: ' ', costPrice: '1', salePrice: '1' }));
  assert.throws(() => validate({ name: 'Caja', costPrice: '0.01', salePrice: '9999999999.99' }));
});
