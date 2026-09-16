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

  function validateInitial(values) {
    const product = validate(values);
    if (!['UNIT', 'KILOGRAM', 'METER', 'LITER'].includes(values.unit)) {
      throw new Error('Elegí una unidad válida.');
    }
    if (typeof values.stock !== 'string' || !/^\d{1,12}(\.\d{1,3})?$/.test(values.stock)) {
      throw new Error('El stock inicial debe ser no negativo, con hasta doce enteros y tres decimales.');
    }
    const [whole, fraction = ''] = values.stock.split('.');
    if (values.unit === 'UNIT' && /[1-9]/.test(fraction)) {
      throw new Error('Los productos por unidad requieren stock entero.');
    }
    const decimal = fraction.replace(/0+$/, '');
    const stock = `${BigInt(whole)}${decimal ? `.${decimal}` : ''}`;
    return { ...product, unit: values.unit, stock };
  }

  function saleFromMarkup(costPrice, percentage) {
    const cost = cents(costPrice);
    if (cost === 0n) throw new Error('Con costo cero, escribí directamente el precio de venta.');
    let markup;
    try { markup = cents(percentage); }
    catch { throw new Error('El porcentaje debe ser no negativo y tener hasta dos decimales.'); }
    // 50 % se representa como 5000; redondeamos la venta al centavo más cercano.
    const sale = (cost * (10000n + markup) + 5000n) / 10000n;
    if (sale > 999999999999n) throw new Error('El precio calculado excede el límite admitido.');
    return format(sale);
  }

  const pricing = { cents, validate, validateInitial, saleFromMarkup };
  if (typeof module !== 'undefined' && module.exports) module.exports = pricing;
  else root.stockiziPricing = pricing;
})(globalThis);
