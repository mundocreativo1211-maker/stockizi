const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, cents } = require('../pricing');

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
