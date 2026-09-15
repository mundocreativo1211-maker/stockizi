const http = require('node:http');
const { listProducts, updateProduct } = require('./products');
const pricing = require('../pricing');

function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

async function saveProduct(request, response, database, id) {
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
    const fields = ['name', 'costPrice', 'salePrice'];
    if (!exactKeys(input, [...fields, 'expected']) || !exactKeys(input.expected, fields) ||
        typeof input.expected.name !== 'string' || input.expected.name.length > 8192) {
      throw new Error('Campos inválidos: solo se editan nombre, costo y venta.');
    }
    pricing.cents(input.expected.costPrice);
    pricing.cents(input.expected.salePrice);
    values = pricing.validate(input);
  } catch (error) {
    return sendJson(response, 400, { error: error instanceof SyntaxError ? 'JSON inválido.' : error.message });
  }
  try {
    const product = await updateProduct(database, id, values, input.expected);
    if (!product) return sendJson(response, 409, { error: 'El producto cambió o ya no existe. Conservá tus cambios y volvé a consultar antes de editar.' });
    return sendJson(response, 200, { product });
  } catch (error) {
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
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET');
      sendJson(response, 405, { error: 'Esta API solo permite consultar productos.' });
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
