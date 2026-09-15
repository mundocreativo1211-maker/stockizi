// Este módulo corre en el proceso principal, no dentro de la página.
function validId(value) {
  return typeof value === 'string' && /^\d{1,19}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n;
}

function validatePage(data, afterId) {
  const decimal = value => typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value);
  if (!data || !Array.isArray(data.products) || data.products.length > 100) {
    throw new Error('Respuesta inválida');
  }
  let previousId = BigInt(afterId);
  for (const product of data.products) {
    if (!product || !validId(product.id) || BigInt(product.id) <= previousId ||
        typeof product.name !== 'string' || !decimal(product.costPrice) ||
        !decimal(product.salePrice) || !decimal(product.stock) ||
        (product.markupPercentage !== null && !decimal(product.markupPercentage)) ||
        !['UNIT', 'KILOGRAM', 'METER', 'LITER'].includes(product.unit) ||
        typeof product.active !== 'boolean') {
      throw new Error('Producto inválido');
    }
    previousId = BigInt(product.id);
  }
  if (data.nextAfterId !== null &&
      (!data.products.length || data.nextAfterId !== data.products.at(-1).id)) {
    throw new Error('Paginación inválida');
  }
  return data;
}

async function fetchProductsPage(afterId = '0', { port = 3000, fetchImpl = fetch } = {}) {
  if (!validId(afterId) || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'La configuración de la consulta no es válida.' };
  }
  try {
    // Dirección fija local: la pantalla solo puede elegir el cursor, no otra URL.
    const response = await fetchImpl(`http://127.0.0.1:${port}/api/products?afterId=${afterId}`, {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('API no disponible');
    const data = validatePage(await response.json(), afterId);
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: 'No se pudieron cargar los productos. Comprobá que npm run api siga ejecutándose y usá Actualizar.' };
  }
}

async function saveProduct(id, changes, { port = 3000, fetchImpl = fetch } = {}) {
  if (!validId(id) || BigInt(id) === 0n || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'Configuración de guardado inválida.' };
  }
  try {
    const response = await fetchImpl(`http://127.0.0.1:${port}/api/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes), redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok) {
      const messages = {
        400: 'Datos inválidos. Revisá nombre, importes y que la venta no sea menor al costo.',
        403: 'Falta habilitar stockizi_editor en PostgreSQL y .env; luego reiniciar la API.',
        409: 'El producto cambió o ya no existe. Copiá tus cambios y usá Cancelar y Actualizar antes de editarlo nuevamente.',
      };
      return { ok: false, error: messages[response.status] || 'No se pudo confirmar el guardado. Consultá los datos antes de reintentar.' };
    }
    validatePage({ products: [data.product], nextAfterId: null }, '0');
    if (data.product.id !== id) throw new Error('Producto incorrecto');
    return { ok: true, product: data.product };
  } catch {
    return { ok: false, error: 'No se pudo confirmar el guardado. Conservamos tu formulario; consultá los datos antes de reintentar.' };
  }
}

module.exports = { fetchProductsPage, validatePage, saveProduct };
