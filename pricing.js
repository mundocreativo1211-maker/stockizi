// Centavos enteros: evitamos errores de precisión al comparar dinero.
(function (root) {
  function cents(value) {
    if (typeof value !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
      throw new Error('Usá importes no negativos, con hasta diez enteros y dos decimales.');
    }
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  }

  function format(value) {
    return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
  }

  function validate(values) {
    if (typeof values.name !== 'string' || !values.name.trim() || values.name.trim().length > 200) {
      throw new Error('El nombre es obligatorio y admite hasta 200 caracteres.');
    }
    const cost = cents(values.costPrice);
    const sale = cents(values.salePrice);
    if (sale < cost) throw new Error('El precio de venta no puede ser menor que el costo.');
    // Porcentaje sobre costo, redondeado a dos decimales. Con costo cero no se define.
    const markup = cost === 0n ? null : ((sale - cost) * 10000n + cost / 2n) / cost;
    if (markup !== null && markup > 999999999999n) {
      throw new Error('El porcentaje calculado excede el límite admitido.');
    }
    return { name: values.name.trim(), costPrice: format(cost), salePrice: format(sale),
      markupPercentage: markup === null ? null : format(markup) };
  }

  const pricing = { cents, validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = pricing;
  else root.stockiziPricing = pricing;
})(globalThis);
