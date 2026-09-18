// Este módulo corre en el proceso principal, no dentro de la página.
const { productFilters } = require('./product-filters');
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
        typeof product.active !== 'boolean' ||
        ![product.categoryId, product.subcategoryId].every(value => value == null || (validId(value) && BigInt(value) > 0n))) {
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

async function fetchProductsPage(afterId = '0', { port = 3000, fetchImpl = fetch, filters = {} } = {}) {
  if (!validId(afterId) || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'La configuración de la consulta no es válida.' };
  }
  try {
    const params = new URLSearchParams({ afterId });
    for (const [key, value] of Object.entries(productFilters(filters))) if (value) params.set(key, value);
    // Dirección fija local: solo cursor y filtros validados, no otra URL.
    const response = await fetchImpl(`http://127.0.0.1:${port}/api/products?${params}`, {
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
        400: 'Datos inválidos. Revisá nombre, precios y que la subcategoría pertenezca al rubro elegido.',
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

async function createProduct(values, { port = 3000, fetchImpl = fetch } = {}) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { ok: false, error: 'Puerto de API inválido.' };
  }
  try {
    const response = await fetchImpl(`http://127.0.0.1:${port}/api/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values), redirect: 'error', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const errors = {
        400: 'Revisá nombre, precios, unidad, stock inicial y rubro/subcategoría. No se creó el producto.',
        403: 'Para crear productos revisá las migraciones 004/005 y el usuario stockizi_editor.',
        409: 'La solicitud ya se usó con otros datos. Revisá el catálogo antes de iniciar otra alta.',
      };
      return { ok: false, error: errors[response.status] || 'Alta no confirmada. Reintentá sin cambiar los datos para evitar duplicados.' };
    }
    const data = await response.json();
    validatePage({ products: [data.product], nextAfterId: null }, '0');
    return { ok: true, product: data.product };
  } catch {
    return { ok: false, error: 'Alta no confirmada. Reintentá sin cambiar los datos: se conserva la misma solicitud para evitar duplicados.' };
  }
}

function validateCategories(data) {
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.subcategories)) throw new Error('Rubros inválidos');
  for (const rows of [data.categories, data.subcategories]) {
    const seen = new Set();
    for (const row of rows) {
      if (!row || !validId(row.id) || BigInt(row.id) === 0n || seen.has(row.id) ||
          typeof row.name !== 'string' || !row.name.trim() || row.name.length > 80) throw new Error('Rubro inválido');
      seen.add(row.id);
    }
  }
  if (data.subcategories.some(row => !data.categories.some(parent => parent.id === row.categoryId))) throw new Error('Rubro padre inválido');
  return data;
}

async function categoryRequest(kind = 'categories', id = null, input, { port = 3000, fetchImpl = fetch } = {}) {
  if (!['categories', 'subcategories'].includes(kind) || (id !== null && (!validId(id) || BigInt(id) === 0n)) ||
      !Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, error: 'Solicitud inválida.' };
  try {
    const writing = input !== undefined;
    const response = await fetchImpl(`http://127.0.0.1:${port}/api/${kind}${id ? `/${id}` : ''}`, {
      method: writing ? (id ? 'PATCH' : 'POST') : 'GET', redirect: 'error', signal: AbortSignal.timeout(8000),
      ...(writing ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}),
    });
    if (!response.ok) {
      const messages = { 400: 'Revisá el nombre (hasta 80 caracteres) y el rubro elegido.',
        403: 'Revisá la migración 005 y el usuario stockizi_editor.',
        409: 'Ese nombre ya existe o fue modificado. Volvé a consultar antes de renombrar.' };
      return { ok: false, error: messages[response.status] || 'No se pudo confirmar la operación de rubros. Revisá la conexión y la migración 005.' };
    }
    const data = await response.json();
    if (!writing) return { ok: true, ...validateCategories(data) };
    if (!data.item || !validId(data.item.id) || BigInt(data.item.id) === 0n || (id && data.item.id !== id) ||
        typeof data.item.name !== 'string' || !data.item.name.trim() || data.item.name.length > 80 ||
        (kind === 'subcategories' && (!validId(data.item.categoryId) || BigInt(data.item.categoryId) === 0n))) throw new Error('Respuesta inválida');
    return { ok: true, item: data.item };
  } catch { return { ok: false, error: 'No se pudo confirmar la operación de rubros. Volvé a consultar antes de reintentar.' }; }
}

async function codeRequest(operation, productId, value, { port = 3000, fetchImpl = fetch } = {}) {
  const positiveId = id => validId(id) && BigInt(id) > 0n;
  if (!['list', 'add', 'remove', 'find'].includes(operation) ||
      !Number.isInteger(port) || port < 1 || port > 65535 ||
      (operation !== 'find' && !positiveId(productId)) ||
      (operation === 'remove' && !positiveId(value))) return { ok: false, error: 'Solicitud inválida.' };
  if (['add', 'find'].includes(operation) &&
      (typeof value !== 'string' || !value.trim() || value.trim().length > 100 || /[\u0000-\u001f\u007f-\u009f]/.test(value))) {
    return { ok: false, error: 'Usá un código de 1 a 100 caracteres, sin saltos de línea.' };
  }
  const route = operation === 'find' ? `/products/by-code?code=${encodeURIComponent(value.trim())}`
    : `/products/${productId}/codes${operation === 'remove' ? `/${value}` : ''}`;
  try {
    const response = await fetchImpl(`http://127.0.0.1:${port}/api${route}`, {
      method: operation === 'add' ? 'POST' : operation === 'remove' ? 'DELETE' : 'GET',
      redirect: 'error', signal: AbortSignal.timeout(8000),
      ...(operation === 'add' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: value.trim() }) } : {}),
    });
    if (!response.ok) {
      const messages = { 400: 'Revisá el código ingresado.', 403: 'Revisá la migración 006 y los permisos de stockizi_editor.',
        404: 'El producto o la asociación ya no existe. Volvé a consultar.', 409: 'Ese código ya pertenece a otro producto.' };
      return { ok: false, error: messages[response.status] || 'No se pudo confirmar la operación. Volvé a consultar los códigos.' };
    }
    const data = await response.json();
    if (operation === 'find') {
      if (data.product !== null) validatePage({ products: [data.product], nextAfterId: null }, '0');
      return { ok: true, product: data.product };
    }
    if (operation === 'remove') {
      if (data.removed !== true) throw new Error('Respuesta inválida');
      return { ok: true, removed: true };
    }
    const rows = operation === 'list' ? data.codes : [data.item];
    const seen = new Set();
    if (!Array.isArray(rows)) throw new Error('Respuesta inválida');
    for (const item of rows) {
      if (!item || !positiveId(item.id) || item.productId !== productId ||
          typeof item.code !== 'string' || !item.code.trim() || item.code.length > 100 || seen.has(item.id) ||
          (operation === 'add' && item.code !== value.trim())) throw new Error('Código inválido');
      seen.add(item.id);
    }
    return operation === 'list' ? { ok: true, codes: rows } : { ok: true, item: rows[0] };
  } catch { return { ok: false, error: 'No se pudo confirmar la operación. Volvé a consultar los códigos antes de reintentar.' }; }
}

module.exports = { fetchProductsPage, validatePage, saveProduct, createProduct, categoryRequest, validateCategories, codeRequest };
