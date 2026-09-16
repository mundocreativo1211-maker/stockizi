const http = require('node:http');
const { listProducts, updateProduct, createProduct } = require('./products');
const pricing = require('../pricing');
const { validId, classification, listCategories, saveCategory } = require('./categories');
const { cleanCode, listCodes, addCode, removeCode, findByCode } = require('./codes');

async function codeRoute(request, response, database, productId, id, url) {
  const lookup = productId === undefined;
  const allowed = lookup ? ['GET'] : id ? ['DELETE'] : ['GET', 'POST'];
  if (!allowed.includes(request.method)) {
    response.setHeader('Allow', allowed.join(', '));
    return sendJson(response, 405, { error: 'Método no admitido.' });
  }
  let code;
  try {
    if (lookup) code = cleanCode(url.searchParams.get('code'));
    if (request.method === 'POST') {
      const input = await readJson(request);
      if (!exactKeys(input, ['code'])) throw new Error('Solo se admite el código.');
      code = cleanCode(input.code);
    }
  } catch (error) { return sendJson(response, error.status || 400, { error: error.message }); }
  try {
    if (lookup) return sendJson(response, 200, { product: await findByCode(database, code) });
    if (request.method === 'GET') return sendJson(response, 200, { codes: await listCodes(database, productId) });
    if (request.method === 'DELETE') {
      const removed = await removeCode(database, productId, id);
      return sendJson(response, removed ? 200 : 404, removed ? { removed: true } : { error: 'Asociación no encontrada.' });
    }
    const result = await addCode(database, productId, code);
    if (!result) return sendJson(response, 409, { error: 'El código ya pertenece a otro producto.' });
    return sendJson(response, result.created ? 201 : 200, { item: result.item });
  } catch (error) {
    if (error.code === '23503') return sendJson(response, 404, { error: 'El producto no existe.' });
    if (['42P01', '42501', '25006'].includes(error.code)) return sendJson(response, 403, { error: 'Revisá la migración 006 y los permisos del usuario.' });
    return sendJson(response, 503, { error: 'No se pudo confirmar la operación. Volvé a consultar los códigos.' });
  }
}

async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw Object.assign(new Error('La solicitud requiere JSON.'), { status: 415 });
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8192) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('JSON inválido.'); }
}

async function categoryRoute(request, response, database, kind, id) {
  if (!id && kind === 'categories' && request.method === 'GET') {
    try { return sendJson(response, 200, await listCategories(database)); }
    catch { return sendJson(response, 503, { error: 'No se pudieron leer los rubros. Revisá la migración 005.' }); }
  }
  const method = id ? 'PATCH' : 'POST';
  if (request.method !== method) {
    response.setHeader('Allow', !id && kind === 'categories' ? 'GET, POST' : method);
    return sendJson(response, 405, { error: 'Método no admitido.' });
  }
  let input;
  try {
    input = await readJson(request);
    const fields = id ? ['name', 'expectedName'] : kind === 'subcategories' ? ['name', 'categoryId'] : ['name'];
    if (!exactKeys(input, fields) || typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 80 ||
        (id && (typeof input.expectedName !== 'string' || input.expectedName.length > 80)) ||
        (!id && kind === 'subcategories' && !validId(input.categoryId))) throw new Error('Nombre o rubro inválido. Máximo 80 caracteres.');
    input.name = input.name.trim();
  } catch (error) { return sendJson(response, error.status || 400, { error: error.message }); }
  try {
    const result = await saveCategory(database, kind, id, input);
    if (!result) return sendJson(response, 409, { error: 'El nombre cambió. Volvé a consultar antes de renombrar.' });
    return sendJson(response, result.created ? 201 : 200, { item: result.item });
  } catch (error) {
    if (error.code === '23505') return sendJson(response, 409, { error: 'Ese nombre ya existe en el mismo rubro o nivel.' });
    if (error.code === '23503') return sendJson(response, 400, { error: 'El rubro elegido no existe.' });
    if (['42501', '25006', '42P01'].includes(error.code)) return sendJson(response, 403, { error: 'Revisá 005 y los permisos de stockizi_editor.' });
    return sendJson(response, 503, { error: 'No se pudo confirmar el guardado del rubro.' });
  }
}

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

async function saveProduct(request, response, database, id) {
  const creating = id === undefined;
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    return sendJson(response, 415, { error: 'El guardado requiere JSON.' });
  }
  let input, values;
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 8192) return sendJson(response, 413, { error: 'Solicitud demasiado grande.' });
      chunks.push(chunk);
    }
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const categoryFields = input && (Object.hasOwn(input, 'categoryId') || Object.hasOwn(input, 'subcategoryId'))
      ? ['categoryId', 'subcategoryId'] : [];
    if (creating) {
      if (!exactKeys(input, ['name', 'costPrice', 'salePrice', 'unit', 'stock', 'requestId', ...categoryFields]) ||
          typeof input.requestId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) {
        throw new Error('Campos o identificador de alta inválidos.');
      }
      values = pricing.validateInitial(input);
    } else {
      const fields = ['name', 'costPrice', 'salePrice', ...categoryFields];
      if (!exactKeys(input, [...fields, 'expected']) || !exactKeys(input.expected, fields) ||
          typeof input.expected.name !== 'string' || input.expected.name.length > 8192) {
        throw new Error('Campos inválidos: solo se editan nombre, costo y venta.');
      }
      pricing.cents(input.expected.costPrice);
      pricing.cents(input.expected.salePrice);
      values = pricing.validate(input);
      if (categoryFields.length) classification(input.expected);
    }
    if (categoryFields.length) Object.assign(values, classification(input));
  } catch (error) {
    return sendJson(response, 400, { error: error instanceof SyntaxError ? 'JSON inválido.' : error.message });
  }
  try {
    if (creating) {
      const result = await createProduct(database, input.requestId, values);
      if (!result) return sendJson(response, 409, { error: 'Esta solicitud ya se usó con otros datos. Consultá el catálogo antes de iniciar otra alta.' });
      return sendJson(response, result.created ? 201 : 200, { product: result.product });
    }
    const product = await updateProduct(database, id, values, input.expected);
    if (!product) return sendJson(response, 409, { error: 'El producto cambió o ya no existe. Conservá tus cambios y volvé a consultar antes de editar.' });
    return sendJson(response, 200, { product });
  } catch (error) {
    if (error.code === '23503' || error.constraint === 'products_subcategory_needs_category') {
      return sendJson(response, 400, { error: 'La subcategoría debe pertenecer al rubro elegido y ambos deben existir.' });
    }
    if (creating && ['42703', '42P01', '42501', '25006'].includes(error.code)) {
      return sendJson(response, 403, { error: 'El alta requiere la migración 004 y el usuario stockizi_editor.' });
    }
    if (error.code === '42501' || error.code === '25006') {
      return sendJson(response, 403, { error: 'La conexión no tiene permiso para editar. Completá la configuración de stockizi_editor y reiniciá la API.' });
    }
    return sendJson(response, 503, { error: 'No se pudo confirmar el guardado. Volvé a consultar antes de reintentar.' });
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

function createApi(database) {
  return http.createServer(async (request, response) => {
    // Solo desarrollo local. No habilitamos acceso desde páginas externas.
    const port = request.socket.localPort;
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!hosts.includes(request.headers.host) ||
        (request.headers.origin && !hosts.some(host => request.headers.origin === `http://${host}`))) {
      sendJson(response, 403, { error: 'Acceso permitido solo desde esta API local.' });
      return;
    }
    let url;
    try {
      url = new URL(request.url, 'http://localhost');
    } catch {
      sendJson(response, 400, { error: 'Dirección inválida.' });
      return;
    }
    if (url.pathname === '/api/products/by-code') return codeRoute(request, response, database, undefined, undefined, url);
    const codeMatch = /^\/api\/products\/([1-9]\d{0,18})\/codes(?:\/([1-9]\d{0,18}))?$/.exec(url.pathname);
    if (codeMatch && validId(codeMatch[1]) && (!codeMatch[2] || validId(codeMatch[2]))) {
      return codeRoute(request, response, database, codeMatch[1], codeMatch[2], url);
    }
    const categoryMatch = /^\/api\/(categories|subcategories)(?:\/([1-9]\d{0,18}))?$/.exec(url.pathname);
    if (categoryMatch && (!categoryMatch[2] || validId(categoryMatch[2]))) {
      return categoryRoute(request, response, database, categoryMatch[1], categoryMatch[2]);
    }
    const editRoute = /^\/api\/products\/([1-9]\d{0,18})$/.exec(url.pathname);
    if (editRoute && BigInt(editRoute[1]) <= 9223372036854775807n) {
      if (request.method !== 'PATCH') {
        response.setHeader('Allow', 'PATCH');
        return sendJson(response, 405, { error: 'Usá PATCH para editar un producto.' });
      }
      return saveProduct(request, response, database, editRoute[1]);
    }
    if (url.pathname !== '/api/products') {
      sendJson(response, 404, { error: 'Ruta no encontrada.' });
      return;
    }
    if (request.method === 'POST') return saveProduct(request, response, database);
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET, POST');
      sendJson(response, 405, { error: 'Usá GET para consultar o POST para crear productos.' });
      return;
    }
    const afterId = url.searchParams.get('afterId') || '0';
    if (!/^\d{1,19}$/.test(afterId) || BigInt(afterId) > 9223372036854775807n) {
      sendJson(response, 400, { error: 'afterId debe ser un identificador válido.' });
      return;
    }
    try {
      // await espera la respuesta de PostgreSQL antes de responder al navegador.
      const result = await listProducts(database, afterId);
      sendJson(response, 200, result);
    } catch {
      // Nunca devolvemos contraseñas, configuración ni errores internos de SQL.
      sendJson(response, 503, { error: 'No se pudieron leer los productos. Revisá la conexión, la tabla y los permisos.' });
    }
  });
}

module.exports = { createApi };
